import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleApplications } from '../server/handlers/applications'
import { handlePaymentInitialize, handlePaymentSummary, handlePaymentVerify, handlePaystackWebhook, handleReconcile } from '../server/handlers/payments'
import { assessTransaction, isAllowedCheckoutUrl, isValidPaystackSignature } from '../server/paystack'
import { createRateLimiter } from '../server/rateLimit'
import { signResumeToken } from '../server/tokens'
import { makeDeps, validApplication, jsonRequest, read, SECRET, PAYSTACK_KEY, RECONCILE_SECRET } from './helpers/deps'

async function applied() {
  const ctx = makeDeps()
  const created = await read(await handleApplications(jsonRequest('/api/applications', validApplication), ctx.deps))
  const { applicationId, resumeToken } = created.body.data
  ctx.emails.length = 0
  const app = () => ctx.harness.records('Applications').find((r) => r['Application ID'] === applicationId)!
  const payments = () => ctx.harness.records('Payments')
  const start = async (body: Record<string, unknown> = { resumeToken }) => read(await handlePaymentInitialize(jsonRequest('/api/paystack/initialize', body), ctx.deps))
  const verify = async (reference: string) => read(await handlePaymentVerify(jsonRequest('/api/paystack/verify', { reference }), ctx.deps))
  const webhook = async (raw: string, signature: string) =>
    read(await handlePaystackWebhook(new Request('https://cse.example.edu.ng/api/paystack/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-paystack-signature': signature }, body: raw }), ctx.deps))
  return { ...ctx, applicationId, resumeToken, app, payments, start, verify, webhook }
}

/* ── Summary / lookup ── */

test('summary via resume token shows applicant, programme and server fee', async () => {
  const t = await applied()
  const { body } = await read(await handlePaymentSummary(jsonRequest('/api/payments/summary', { resumeToken: t.resumeToken }), t.deps))
  assert.equal(body.data.status, 'found')
  assert.equal(body.data.application.applicantName, 'Ada Okafor')
  assert.equal(body.data.application.fee, 35000)
  assert.equal(body.data.application.paymentStatus, 'Not Started')
  assert.equal(body.data.application.email, undefined, 'email must not be returned')
})

test('summary via Application ID requires the matching email', async () => {
  const t = await applied()
  const ok = await read(await handlePaymentSummary(jsonRequest('/api/payments/summary', { applicationId: t.applicationId.toLowerCase(), email: 'ADA@example.com' }), t.deps))
  assert.equal(ok.body.data.status, 'found')
  const wrong = await read(await handlePaymentSummary(jsonRequest('/api/payments/summary', { applicationId: t.applicationId, email: 'intruder@example.com' }), t.deps))
  assert.deepEqual(wrong.body.data, { status: 'not_found' })
  const bad = await read(await handlePaymentSummary(jsonRequest('/api/payments/summary', { applicationId: '123', email: 'x' }), t.deps))
  assert.equal(bad.status, 422)
})

test('ID + email lookups are rate limited; expired or forged tokens are refused', async () => {
  const t = await applied()
  t.deps.limiters.lookups = createRateLimiter({ limit: 2, windowMs: 60_000 })
  for (let i = 0; i < 2; i++) await handlePaymentSummary(jsonRequest('/api/payments/summary', { applicationId: t.applicationId, email: 'x@example.com' }), t.deps)
  assert.equal((await handlePaymentSummary(jsonRequest('/api/payments/summary', { applicationId: t.applicationId, email: 'ada@example.com' }), t.deps)).status, 429)

  const expired = signResumeToken(t.applicationId, SECRET, { ttlSeconds: 1, now: Date.now() - 10_000 })
  const r = await read(await handlePaymentSummary(jsonRequest('/api/payments/summary', { resumeToken: expired }), t.deps))
  assert.equal(r.body.data.status, 'not_found')
  const forged = signResumeToken(t.applicationId, 'z'.repeat(40))
  assert.equal((await read(await handlePaymentSummary(jsonRequest('/api/payments/summary', { resumeToken: forged }), t.deps))).body.data.status, 'not_found')
})

/* ── Initialize ── */

test('initialize charges the server-side fee, records the attempt, and returns Paystack checkout', async () => {
  const t = await applied()
  const { status, body } = await t.start({ resumeToken: t.resumeToken, amount: 1, email: 'attacker@example.com' })
  assert.equal(status, 200)
  assert.equal(body.data.status, 'redirect')
  assert.match(body.data.authorizationUrl, /^https:\/\/checkout\.paystack\.com\//)
  const tx = t.paystack.transactions.get(body.data.reference)!
  assert.equal(tx.amount, 3_500_000, 'browser-supplied amount must be ignored')
  assert.equal(tx.email, 'ada@example.com', 'email comes from the stored application')
  assert.equal(tx.callbackUrl, 'https://cse.example.edu.ng/payment/status')
  assert.equal((tx.metadata as { applicationId: string }).applicationId, t.applicationId)
  assert.equal(t.payments()[0]['Status'], 'Pending')
  assert.equal(t.app()['Payment Status'], 'Pending')
  assert.equal(t.app()['Payment Reference'], body.data.reference)
})

test('each retry creates a new reference; the application tracks the latest', async () => {
  const t = await applied()
  const a = (await t.start()).body.data.reference
  const b = (await t.start()).body.data.reference
  assert.notEqual(a, b)
  assert.equal(t.payments().length, 2)
  assert.equal(t.app()['Payment Reference'], b)
})

test('initialize refuses sample fees with a live Paystack key and never calls Paystack', async () => {
  const t = await applied()
  t.deps.config.paystackSecretKey = 'sk_live_' + 'b'.repeat(40)
  const { status, body } = await t.start()
  assert.equal(status, 503)
  assert.doesNotMatch(body.message, /sample|live|key/i)
  assert.equal(t.paystack.initializeCalls, 0)
})

test('initialize rejects an unexpected checkout URL', async () => {
  const t = await applied()
  const original = t.paystack.initialize
  t.deps.paystack = { ...t.paystack, initialize: async (i) => ({ ...(await original(i)), authorizationUrl: 'https://evil.example/pay' }) }
  assert.equal((await t.start()).status, 502)
  assert.equal(t.payments().length, 0)
})

test('Paystack outage on initialize returns a plain message and records nothing', async () => {
  const t = await applied()
  t.paystack.failNext('initialize')
  const { status, body } = await t.start()
  assert.equal(status, 502)
  assert.match(body.message, /application is saved/)
  assert.equal(t.payments().length, 0)
})

test('if the latest attempt was actually paid (missed webhook), initialize reports already_paid', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success')
  const second = await t.start()
  assert.equal(second.body.data.status, 'already_paid')
  assert.equal(t.paystack.initializeCalls, 1)
  assert.equal(t.app()['Payment Status'], 'Success')
  assert.equal(t.emails.filter((e) => e.event === 'payment_success').length, 1)
  assert.equal((await t.start()).body.data.status, 'already_paid')
})

/* ── Verify (callback) ── */

test('successful payment: verify updates the sheet and sends one email, even when refreshed', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success')
  const first = await t.verify(reference)
  assert.equal(first.body.data.outcome, 'success')
  assert.equal(first.body.data.amount, 35000)
  assert.equal(first.body.data.applicationId, t.applicationId)
  assert.equal(t.app()['Payment Status'], 'Success')
  assert.equal(t.app()['Payment Amount'], 35000)
  const refresh = await t.verify(reference)
  assert.equal(refresh.body.data.outcome, 'success')
  assert.equal(t.emails.filter((e) => e.event === 'payment_success').length, 1)
})

test('verify never marks success when the paid amount differs', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success', { amount: 100 })
  const r = await t.verify(reference)
  assert.equal(r.body.data.outcome, 'review')
  assert.notEqual(t.app()['Payment Status'], 'Success')
  assert.match(String(t.payments()[0]['Last Event']), /REVIEW: amount_mismatch/)
  assert.equal(t.emails.length, 0)
})

test('verify never marks success for the wrong currency', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success', { currency: 'USD' })
  assert.equal((await t.verify(reference)).body.data.outcome, 'review')
})

test('cancelled payment is saved as Abandoned with follow-up pending and a reminder email', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'abandoned')
  const r = await t.verify(reference)
  assert.equal(r.body.data.outcome, 'abandoned')
  assert.equal(t.app()['Application Status'], 'Submitted', 'application must not disappear')
  assert.equal(t.app()['Payment Status'], 'Abandoned')
  assert.equal(t.app()['Follow-up Status'], 'Pending')
  assert.equal(t.emails.filter((e) => e.event === 'payment_incomplete').length, 1)
})

test('failed payment is recorded as Failed', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'failed')
  assert.equal((await t.verify(reference)).body.data.outcome, 'failed')
  assert.equal(t.app()['Payment Status'], 'Failed')
})

test('invalid or unknown references return not_found without touching records', async () => {
  const t = await applied()
  assert.equal((await t.verify('../../etc/passwd')).body.data.outcome, 'not_found')
  assert.equal((await t.verify(`${t.applicationId}-PNOPE99999`)).body.data.outcome, 'not_found')
  assert.equal(t.payments().length, 0)
})

test('Paystack timeout during verify returns a calm message with no technical detail', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.failNext('verify')
  const r = await t.verify(reference)
  assert.equal(r.status, 502)
  assert.match(r.body.message, /do not pay again/)
  assert.doesNotMatch(JSON.stringify(r.body), /TIMEOUT|paystack\.co|stack/i)
})

/* ── Webhook ── */

test('webhook rejects an invalid signature and changes nothing', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success')
  const { raw } = t.paystack.webhookFor(reference)
  assert.equal((await t.webhook(raw, 'f'.repeat(128))).status, 401)
  assert.equal((await t.webhook(raw.replace('35000', '3500'), t.paystack.webhookFor(reference).signature)).status, 401)
  assert.equal(t.app()['Payment Status'], 'Pending')
})

test('payment completed but callback never happened: webhook alone completes the application', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success')
  const { raw, signature } = t.paystack.webhookFor(reference)
  const r = await t.webhook(raw, signature)
  assert.equal(r.status, 200)
  assert.equal(t.app()['Payment Status'], 'Success')
  assert.equal(t.payments()[0]['Last Event'], 'webhook:charge.success')
})

test('duplicate webhooks and webhook + callback together send only one confirmation', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success')
  const { raw, signature } = t.paystack.webhookFor(reference)
  await t.webhook(raw, signature)
  await t.webhook(raw, signature)
  await t.verify(reference)
  assert.equal(t.emails.filter((e) => e.event === 'payment_success').length, 1)
  assert.equal(t.payments().length, 1)
})

test('webhook ignores other events and transactions that are not ours', async () => {
  const t = await applied()
  const { createHmac } = await import('node:crypto')
  const sign = (raw: string) => createHmac('sha512', PAYSTACK_KEY).update(raw).digest('hex')
  const other = JSON.stringify({ event: 'transfer.success', data: { reference: 'XYZ' } })
  assert.equal((await t.webhook(other, sign(other))).body.ignored, true)
  const foreign = JSON.stringify({ event: 'charge.success', data: { reference: 'SHOP-ORDER-1', amount: 100, currency: 'NGN', status: 'success' } })
  assert.equal((await t.webhook(foreign, sign(foreign))).body.ignored, true)
})

test('webhook returns 500 when records cannot be updated, so Paystack retries', async () => {
  const t = await applied()
  const reference = (await t.start()).body.data.reference
  t.paystack.settle(reference, 'success')
  const { raw, signature } = t.paystack.webhookFor(reference)
  t.deps.sheets = { call: async () => { throw new (await import('../server/sheets')).SheetsError('TIMEOUT') } }
  assert.equal((await t.webhook(raw, signature)).status, 500)
})

/* ── Reconcile ── */

test('reconcile requires the bearer secret', async () => {
  const t = await applied()
  const call = (auth?: string) => handleReconcile(new Request('https://cse.example.edu.ng/api/paystack/reconcile', { method: 'POST', headers: auth ? { authorization: auth } : {} }), t.deps)
  assert.equal((await call()).status, 401)
  assert.equal((await call('Bearer wrong')).status, 401)
  assert.equal((await call(`Bearer ${RECONCILE_SECRET}`)).status, 200)
})

test('reconcile marks stale unpaid attempts Abandoned and catches paid ones with no webhook', async () => {
  const t = await applied()
  const abandonedRef = (await t.start()).body.data.reference
  // A second applicant who paid, but whose webhook and callback both failed
  const other = await read(await handleApplications(jsonRequest('/api/applications', { ...validApplication, email: 'b@example.com', phone: '07035941999', submissionId: 'b3f1c1c2-0000-4000-8000-000000000099' }), t.deps))
  const paidRef = (await t.start({ resumeToken: other.body.data.resumeToken })).body.data.reference
  t.paystack.settle(paidRef, 'success')

  // Age both attempts past the one-hour threshold
  const sheet = t.harness.sheet('Payments')!
  const col = (sheet.data[0] as string[]).indexOf('Initialized At')
  for (const row of sheet.data.slice(1)) row[col] = new Date(Date.now() - 2 * 3600_000)

  const res = await read(await handleReconcile(new Request('https://cse.example.edu.ng/api/paystack/reconcile', { method: 'POST', headers: { authorization: `Bearer ${RECONCILE_SECRET}` } }), t.deps))
  assert.equal(res.body.checked, 2)
  assert.equal(res.body.abandoned, 1)
  assert.equal(res.body.success, 1)
  const rows = t.harness.records('Applications')
  assert.equal(rows.find((r) => r['Payment Reference'] === abandonedRef)!['Follow-up Status'], 'Pending')
  assert.equal(rows.find((r) => r['Payment Reference'] === paidRef)!['Payment Status'], 'Success')
})

/* ── Pure helpers ── */

test('signature, checkout URL and assessment helpers', () => {
  assert.equal(isValidPaystackSignature('{}', null, PAYSTACK_KEY), false)
  assert.equal(isValidPaystackSignature('{}', 'zz', PAYSTACK_KEY), false)
  assert.equal(isAllowedCheckoutUrl('https://checkout.paystack.com/abc'), true)
  assert.equal(isAllowedCheckoutUrl('http://checkout.paystack.com/abc'), false)
  assert.equal(isAllowedCheckoutUrl('https://paystack.com.evil.example/x'), false)
  assert.equal(isAllowedCheckoutUrl('http://localhost:3001/__dev/x', ['http://localhost:3001']), true)
  const tx = { id: 1, status: 'success', reference: 'CSE-2026-000001-PABCDEF1', amount: 2_000_000, currency: 'NGN', paid_at: null, channel: 'card', metadata: { applicationId: 'CSE-2026-000002' } }
  assert.deepEqual(assessTransaction(tx, { reference: tx.reference, applicationId: 'CSE-2026-000001', amountKobo: 2_000_000 }), { ok: false, reason: 'application_mismatch' })
  assert.deepEqual(assessTransaction({ ...tx, metadata: {} }, { reference: 'CSE-2026-000001-POTHER1', applicationId: 'CSE-2026-000001', amountKobo: 2_000_000 }), { ok: false, reason: 'reference_mismatch' })
})
