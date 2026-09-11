import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleApplications } from '../server/handlers/applications'
import { handleEnquiries } from '../server/handlers/enquiries'
import { createRateLimiter } from '../server/rateLimit'
import { signResumeToken, verifyResumeToken } from '../server/tokens'
import { SheetsError, type SheetsClient } from '../server/sheets'
import { applicationReceivedEmail } from '../server/email/templates'
import { makeDeps, validApplication, jsonRequest, read, SECRET } from './helpers/deps'

const req = (body: unknown, headers: Record<string, string> = {}, method = 'POST') => jsonRequest('/api/applications', body, headers, method)

test('creates an application, returns ID + valid resume token, sends confirmation email', async () => {
  const { deps, harness, emails } = makeDeps()
  const { status, body } = await read(await handleApplications(req(validApplication), deps))
  assert.equal(status, 201)
  assert.match(body.data.applicationId, /^CSE-\d{4}-000001$/)
  assert.deepEqual(verifyResumeToken(body.data.resumeToken, SECRET), { applicationId: body.data.applicationId })
  assert.equal(harness.records('Applications')[0]['Programme'], "Master's Degree in Health, Environment, Safety and Security")
  assert.equal(emails[0].event, 'application_received')
  assert.equal(emails[0].message.to, 'ada@example.com')
  assert.match(emails[0].message.text, /₦35,000/)
})

test('retrying the same submission does not create a second record or second email', async () => {
  const { deps, harness, emails } = makeDeps()
  const a = await read(await handleApplications(req(validApplication), deps))
  const b = await read(await handleApplications(req(validApplication), deps))
  assert.equal(b.status, 201)
  assert.equal(b.body.data.applicationId, a.body.data.applicationId)
  assert.equal(harness.records('Applications').length, 1)
  assert.equal(emails.length, 1)
})

test('duplicate email returns no applicant data and emails the existing owner', async () => {
  const { deps, emails } = makeDeps()
  await handleApplications(req(validApplication), deps)
  const second = { ...validApplication, phone: '07035941999', submissionId: 'b3f1c1c2-0000-4000-8000-000000000002' }
  const { status, body } = await read(await handleApplications(req(second), deps))
  assert.equal(status, 200)
  assert.deepEqual(body, { ok: true, data: { status: 'duplicate', reminderSent: true } })
  assert.equal(emails[1].event, 'application_duplicate_reminder')
  assert.equal(emails[1].message.to, 'ada@example.com')
})

test('invalid answers return 422 with field errors and write nothing', async () => {
  const { deps, harness } = makeDeps()
  const { status, body } = await read(await handleApplications(req({ ...validApplication, email: 'nope', programme: 'mba', acceptTerms: false }), deps))
  assert.equal(status, 422)
  assert.deepEqual(Object.keys(body.fieldErrors).sort(), ['acceptTerms', 'email', 'programme'])
  assert.equal(harness.records('Applications').length, 0)
})

test('honeypot submissions are silently discarded', async () => {
  const { deps, harness, logs } = makeDeps()
  const { status, body } = await read(await handleApplications(req({ ...validApplication, companyWebsite: 'http://spam' }), deps))
  assert.equal(status, 200)
  assert.equal(body.data.status, 'duplicate')
  assert.equal(harness.records('Applications').length, 0)
  assert.ok(logs.some((l) => l.event === 'applications.honeypot_triggered'))
})

test('rejects cross-origin, wrong method, non-JSON, oversized and missing submissionId requests', async () => {
  const { deps } = makeDeps()
  assert.equal((await handleApplications(req(validApplication, { origin: 'https://evil.example' }), deps)).status, 403)
  assert.equal((await handleApplications(req(null, {}, 'GET'), deps)).status, 405)
  assert.equal((await handleApplications(req(validApplication, { 'content-type': 'text/plain' }), deps)).status, 415)
  assert.equal((await handleApplications(req({ ...validApplication, address: 'x'.repeat(30_000) }), deps)).status, 413)
  assert.equal((await handleApplications(req({ ...validApplication, submissionId: '../../etc' }), deps)).status, 400)
  assert.equal((await handleApplications(req('{not json'), deps)).status, 400)
})

test('rate limits repeated submissions from one IP', async () => {
  const base = makeDeps()
  const { deps } = makeDeps({ limiters: { ...base.deps.limiters, applications: createRateLimiter({ limit: 2, windowMs: 60_000 }) } })
  await handleApplications(req({}), deps)
  await handleApplications(req({}), deps)
  assert.equal((await handleApplications(req({}), deps)).status, 429)
})

test('data layer failures return a plain message with no technical detail', async () => {
  const failing: SheetsClient = { call: async () => { throw new SheetsError('TIMEOUT') } }
  const { deps, logs } = makeDeps({ sheets: failing })
  const { status, body } = await read(await handleApplications(req(validApplication), deps))
  assert.equal(status, 502)
  assert.doesNotMatch(JSON.stringify(body), /TIMEOUT|Sheets|stack|script\.google/i)
  assert.ok(logs.some((l) => l.event === 'applications.store_failed'))
})

test('refuses to run when server secrets are missing (fails closed)', async () => {
  const { deps } = makeDeps()
  deps.config.signingSecret = ''
  assert.equal((await handleApplications(req(validApplication), deps)).status, 503)
})

test('resume tokens expire and cannot be forged', () => {
  const token = signResumeToken('CSE-2026-000001', SECRET, { ttlSeconds: 60, now: 1_000_000 })
  assert.ok(verifyResumeToken(token, SECRET, { now: 1_030_000 }))
  assert.equal(verifyResumeToken(token, SECRET, { now: 1_100_000 }), null)
  assert.equal(verifyResumeToken(token, 'x'.repeat(40), { now: 1_030_000 }), null)
  const [payload, sig] = token.split('.')
  const tampered = Buffer.from(JSON.stringify({ aid: 'CSE-2026-000002', exp: 9e9, v: 1 })).toString('base64url')
  assert.equal(verifyResumeToken(`${tampered}.${sig}`, SECRET), null)
  assert.equal(verifyResumeToken(payload, SECRET), null)
})

test('records a valid enquiry and maps the course slug to its title', async () => {
  const { deps, harness } = makeDeps()
  const r = new Request('https://cse.example.edu.ng/api/enquiries', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'cse.example.edu.ng', origin: 'https://cse.example.edu.ng' },
    body: JSON.stringify({ fullName: 'Tunde Bello', email: 'tunde@example.com', phone: '', enquiryType: 'Short courses', course: 'h2s-safety', message: 'When is the next H2S course?', companyWebsite: '' }),
  })
  const { status } = await read(await handleEnquiries(r, deps))
  assert.equal(status, 201)
  const [row] = harness.records('Enquiries')
  assert.equal(row['Course'], 'H₂S Safety')
  assert.equal(row['Email'], 'tunde@example.com')
})

test('email templates escape user-supplied values', () => {
  const mail = applicationReceivedEmail({ firstName: '<script>alert(1)</script>', applicationId: 'CSE-2026-000001', programmeName: 'PGD', paymentUrl: 'https://x/payment', feeText: '₦20,000' })
  assert.doesNotMatch(mail.html, /<script>/)
  assert.match(mail.html, /&lt;script&gt;/)
})
