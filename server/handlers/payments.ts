import { APPLICATION_FEES, assertFeesAllowedForKey, formatNaira, toKobo } from '../../shared/fees.js'
import { PROGRAMME_SLUGS, type ProgrammeSlug } from '../../shared/catalog.js'
import {
  PAYMENT_REFERENCE_PATTERN,
  paymentLookupSchema,
  type InitializePaymentResult,
  type PaymentApplicationSummary,
  type PaymentOutcome,
  type PaymentSummaryResult,
  type VerifyPaymentResult,
} from '../../shared/schemas/payment.js'
import { fieldErrors } from '../../shared/validation.js'
import { missingForPayments, missingForSubmissions } from '../config.js'
import type { Deps } from '../deps.js'
import { clientIp, isSameOrigin, json, MESSAGES, methodNotAllowed, readJsonBody } from '../http.js'
import { SheetsError } from '../sheets.js'
import { signResumeToken, verifyResumeToken } from '../tokens.js'
import {
  assessTransaction,
  isAllowedCheckoutUrl,
  isValidPaystackSignature,
  newPaymentReference,
  PaystackError,
  type PaystackTransaction,
} from '../paystack.js'
import { paymentIncompleteEmail, paymentSuccessEmail } from '../email/templates.js'
import { timingSafeEqual } from 'node:crypto'

type SheetApplication = {
  applicationId: string
  firstName: string
  lastName: string
  email: string
  programme: string
  programmeName: string
  applicationStatus: string
  paymentStatus: string
  paymentReference: string
}

const PAYMENT_ERROR = 'We could not start your payment at this time. Your application is saved. Please try again shortly, or contact admissions at cse@fupre.edu.ng.'
const VERIFY_ERROR = 'We could not confirm your payment status right now. If you completed payment, do not pay again. Please check again in a few minutes.'
const PENDING_LIKE = ['Pending', 'Ongoing', 'Processing', 'Queued']

function siteOrigin(request: Request, deps: Deps) {
  return deps.config.siteUrl || new URL(request.url).origin
}

function feeFor(programme: string): number | null {
  return (PROGRAMME_SLUGS as readonly string[]).includes(programme) ? APPLICATION_FEES[programme as ProgrammeSlug] : null
}

/**
 * Identifies the applicant either by a resume token (issued right after submission or a lookup)
 * or by Application ID + matching email. Never reveals whether an ID exists without the email.
 */
async function resolveApplication(
  raw: Record<string, unknown>,
  request: Request,
  deps: Deps,
): Promise<{ ok: true; application: SheetApplication } | { ok: false; response: Response }> {
  if (typeof raw.resumeToken === 'string' && raw.resumeToken) {
    const token = verifyResumeToken(raw.resumeToken, deps.config.signingSecret)
    if (!token) return { ok: false, response: json(200, { ok: true, data: { status: 'not_found', reason: 'session_expired' } }) }
    const r = await deps.sheets.call<{ found: boolean; application?: SheetApplication }>('getApplication', { applicationId: token.applicationId })
    if (!r.found || !r.application) return { ok: false, response: json(200, { ok: true, data: { status: 'not_found' } }) }
    return { ok: true, application: r.application }
  }

  // ID + email lookups are rate limited more strictly to prevent guessing
  if (!deps.limiters.lookups.allow(clientIp(request))) {
    return { ok: false, response: json(429, { ok: false, message: MESSAGES.rateLimited }) }
  }
  const parsed = paymentLookupSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, response: json(422, { ok: false, message: MESSAGES.invalid, fieldErrors: fieldErrors(parsed.error) }) }
  const r = await deps.sheets.call<{ found: boolean; application?: SheetApplication }>('getApplication', parsed.data)
  if (!r.found || !r.application) return { ok: false, response: json(200, { ok: true, data: { status: 'not_found' } }) }
  return { ok: true, application: r.application }
}

function summarize(a: SheetApplication): PaymentApplicationSummary {
  return {
    applicationId: a.applicationId,
    applicantName: `${a.firstName} ${a.lastName}`.trim(),
    programme: a.programme,
    programmeName: a.programmeName,
    fee: feeFor(a.programme),
    paymentStatus: a.paymentStatus || 'Not Started',
    ...(a.paymentStatus === 'Success' && a.paymentReference ? { paidReference: a.paymentReference } : {}),
  }
}

/**
 * Applies a Paystack transaction to our records. Used by callback verification,
 * the webhook and the hourly check, so all three behave identically.
 */
export async function applyPaystackResult(
  reference: string,
  tx: PaystackTransaction,
  deps: Deps,
  event: string,
  origin: string,
): Promise<VerifyPaymentResult> {
  const applicationId = reference.slice(0, 15)
  const pay = await deps.sheets.call<{ found: boolean; payment?: { amount: number | null; programmeName: string; programme: string } }>('getPayment', { reference })
  const metaProgramme = (tx.metadata as { programme?: string } | undefined)?.programme ?? ''
  const expectedNaira = pay.found && pay.payment?.amount ? pay.payment.amount : feeFor(metaProgramme)
  const assessment = assessTransaction(tx, { reference, applicationId, amountKobo: expectedNaira ? expectedNaira * 100 : null })

  if (!assessment.ok) {
    deps.log.error('payments.needs_review', { applicationId, code: assessment.reason })
    await deps.sheets.call('recordPaymentResult', { reference, status: 'Processing', transactionId: String(tx.id ?? ''), event: `REVIEW: ${assessment.reason}` })
    return { outcome: 'review', reference, applicationId, programmeName: pay.payment?.programmeName }
  }

  const amount = Math.round(Number(tx.amount) / 100)
  const result = await deps.sheets.call<{
    changed: boolean
    becameSuccess?: boolean
    becameAbandoned?: boolean
    application?: { applicationId: string; firstName: string; email: string; programmeName: string }
  }>('recordPaymentResult', {
    reference,
    status: assessment.sheetStatus,
    transactionId: tx.id ? String(tx.id) : '',
    channel: tx.channel ?? '',
    paidAt: tx.paid_at ?? '',
    amount: assessment.sheetStatus === 'Success' ? amount : undefined,
    event,
  })

  if (result.becameSuccess && result.application) {
    const mail = paymentSuccessEmail({ ...result.application, reference, amountText: formatNaira(amount), paidAt: tx.paid_at })
    await deps.sendEmail({ to: result.application.email, ...mail }, 'payment_success')
    deps.log.info('payments.success', { applicationId })
  } else if (result.becameAbandoned && result.application) {
    const mail = paymentIncompleteEmail({ ...result.application, paymentUrl: `${origin}/payment` })
    await deps.sendEmail({ to: result.application.email, ...mail }, 'payment_incomplete')
    deps.log.info('payments.abandoned', { applicationId })
  }

  return {
    outcome: assessment.outcome,
    reference,
    applicationId,
    programmeName: pay.payment?.programmeName,
    amount: assessment.sheetStatus === 'Success' ? amount : undefined,
    paidAt: assessment.sheetStatus === 'Success' ? tx.paid_at : null,
  }
}

/* ── POST /api/payments/summary ─────────────────────────────── */

export async function handlePaymentSummary(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  if (missingForSubmissions(deps.config).length) {
    deps.log.error('payments.summary_misconfigured')
    return json(503, { ok: false, message: MESSAGES.generic })
  }
  if (!isSameOrigin(request)) return json(403, { ok: false, message: MESSAGES.generic })
  const body = await readJsonBody(request, 4_000)
  if (!body.ok) return body.response

  try {
    const resolved = await resolveApplication(body.data, request, deps)
    if (!resolved.ok) return resolved.response
    const data: PaymentSummaryResult = {
      status: 'found',
      application: summarize(resolved.application),
      resumeToken: signResumeToken(resolved.application.applicationId, deps.config.signingSecret),
    }
    return json(200, { ok: true, data })
  } catch (err) {
    deps.log.error('payments.summary_failed', { code: err instanceof SheetsError ? err.code : 'UNEXPECTED' })
    return json(502, { ok: false, message: MESSAGES.generic })
  }
}

/* ── POST /api/paystack/initialize ──────────────────────────── */

export async function handlePaymentInitialize(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  const missing = missingForPayments(deps.config)
  if (missing.length) {
    deps.log.error('payments.initialize_misconfigured', { detail: missing.join(',') })
    return json(503, { ok: false, message: PAYMENT_ERROR })
  }
  if (!isSameOrigin(request)) return json(403, { ok: false, message: MESSAGES.generic })
  if (!deps.limiters.payments.allow(clientIp(request))) return json(429, { ok: false, message: MESSAGES.rateLimited })
  const body = await readJsonBody(request, 4_000)
  if (!body.ok) return body.response

  try {
    const resolved = await resolveApplication(body.data, request, deps)
    if (!resolved.ok) {
      // For payment start, an unknown application is an error rather than a lookup result
      return resolved.response.status === 200 ? json(404, { ok: false, message: 'We could not find that application. Check your Application ID and email address.' }) : resolved.response
    }
    const app = resolved.application
    const origin = siteOrigin(request, deps)

    if (app.paymentStatus === 'Success') return json(200, { ok: true, data: { status: 'already_paid' } satisfies InitializePaymentResult })

    const fee = feeFor(app.programme)
    if (fee === null) return json(200, { ok: true, data: { status: 'fee_unavailable' } satisfies InitializePaymentResult })

    try {
      assertFeesAllowedForKey(deps.config.paystackSecretKey)
    } catch {
      deps.log.error('payments.sample_fees_with_live_key')
      return json(503, { ok: false, message: PAYMENT_ERROR })
    }

    // Before starting a new attempt, check whether the latest attempt was in fact paid (e.g. a missed webhook)
    if (app.paymentReference && PAYMENT_REFERENCE_PATTERN.test(app.paymentReference) && PENDING_LIKE.includes(app.paymentStatus)) {
      try {
        const latest = await deps.paystack.verify(app.paymentReference)
        if (latest.found && String(latest.transaction.status).toLowerCase() === 'success') {
          const applied = await applyPaystackResult(app.paymentReference, latest.transaction, deps, 'initialize:latest_attempt_paid', origin)
          if (applied.outcome === 'success') return json(200, { ok: true, data: { status: 'already_paid' } satisfies InitializePaymentResult })
        }
      } catch (err) {
        deps.log.warn('payments.latest_attempt_check_failed', { applicationId: app.applicationId, code: err instanceof PaystackError ? err.code : 'UNEXPECTED' })
      }
    }

    const reference = newPaymentReference(app.applicationId, deps.randomToken)
    const init = await deps.paystack.initialize({
      email: app.email,
      amountKobo: toKobo(fee),
      reference,
      callbackUrl: `${origin}/payment/status`,
      metadata: {
        applicationId: app.applicationId,
        programme: app.programme,
        purpose: 'application_fee',
        custom_fields: [
          { display_name: 'Application ID', variable_name: 'application_id', value: app.applicationId },
          { display_name: 'Programme', variable_name: 'programme', value: app.programmeName },
        ],
      },
    })

    if (!isAllowedCheckoutUrl(init.authorizationUrl, deps.allowedCheckoutOrigins)) {
      deps.log.error('payments.unexpected_checkout_url', { applicationId: app.applicationId })
      return json(502, { ok: false, message: PAYMENT_ERROR })
    }

    // Record the attempt before sending the applicant away, so abandoned payments are always traceable
    await deps.sheets.call('recordPaymentInit', { applicationId: app.applicationId, reference, amount: fee })
    deps.log.info('payments.initialized', { applicationId: app.applicationId })

    return json(200, { ok: true, data: { status: 'redirect', authorizationUrl: init.authorizationUrl, reference } satisfies InitializePaymentResult })
  } catch (err) {
    const code = err instanceof SheetsError || err instanceof PaystackError ? err.code : 'UNEXPECTED'
    deps.log.error('payments.initialize_failed', { code })
    return json(502, { ok: false, message: PAYMENT_ERROR })
  }
}

/* ── POST /api/paystack/verify ──────────────────────────────── */

export async function handlePaymentVerify(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  const missing = missingForPayments(deps.config)
  if (missing.length) {
    deps.log.error('payments.verify_misconfigured', { detail: missing.join(',') })
    return json(503, { ok: false, message: VERIFY_ERROR })
  }
  if (!isSameOrigin(request)) return json(403, { ok: false, message: MESSAGES.generic })
  if (!deps.limiters.payments.allow(clientIp(request))) return json(429, { ok: false, message: MESSAGES.rateLimited })
  const body = await readJsonBody(request, 1_000)
  if (!body.ok) return body.response

  const reference = typeof body.data.reference === 'string' ? body.data.reference.trim() : ''
  if (!PAYMENT_REFERENCE_PATTERN.test(reference)) {
    return json(200, { ok: true, data: { outcome: 'not_found', reference: '' } satisfies VerifyPaymentResult })
  }

  try {
    const result = await deps.paystack.verify(reference)
    if (!result.found) {
      return json(200, { ok: true, data: { outcome: 'not_found', reference } satisfies VerifyPaymentResult })
    }
    const applied = await applyPaystackResult(reference, result.transaction, deps, 'verify:callback', siteOrigin(request, deps))
    return json(200, { ok: true, data: applied })
  } catch (err) {
    deps.log.error('payments.verify_failed', { applicationId: reference.slice(0, 15), code: err instanceof SheetsError || err instanceof PaystackError ? err.code : 'UNEXPECTED' })
    return json(502, { ok: false, message: VERIFY_ERROR })
  }
}

/* ── POST /api/paystack/webhook ─────────────────────────────── */

export async function handlePaystackWebhook(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  if (missingForPayments(deps.config).length) {
    deps.log.error('webhook.misconfigured')
    return json(503, { ok: false })
  }

  const raw = await request.text()
  if (raw.length > 200_000) return json(413, { ok: false })

  if (!isValidPaystackSignature(raw, request.headers.get('x-paystack-signature'), deps.config.paystackSecretKey)) {
    deps.log.warn('webhook.invalid_signature')
    return json(401, { ok: false })
  }

  let event: { event?: string; data?: PaystackTransaction }
  try {
    event = JSON.parse(raw)
  } catch {
    return json(400, { ok: false })
  }

  const reference = event.data?.reference ?? ''
  if (event.event !== 'charge.success' || !PAYMENT_REFERENCE_PATTERN.test(reference)) {
    // Other events, or transactions that do not belong to this website: acknowledge and ignore
    return json(200, { ok: true, ignored: true })
  }

  try {
    const applied = await applyPaystackResult(reference, event.data as PaystackTransaction, deps, 'webhook:charge.success', deps.config.siteUrl || new URL(request.url).origin)
    return json(200, { ok: true, outcome: applied.outcome })
  } catch (err) {
    // A non-2xx response makes Paystack retry the webhook later
    deps.log.error('webhook.processing_failed', { applicationId: reference.slice(0, 15), code: err instanceof SheetsError ? err.code : 'UNEXPECTED' })
    return json(500, { ok: false })
  }
}

/* ── POST /api/paystack/reconcile (hourly, from Apps Script) ── */

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || secret.length < 32) return false
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ''))
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function handleReconcile(request: Request, deps: Deps, { timeBudgetMs = 8_000 } = {}): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  if (missingForPayments(deps.config).length || deps.config.reconcileSecret.length < 32) {
    deps.log.error('reconcile.misconfigured')
    return json(503, { ok: false })
  }
  if (!bearerMatches(request.headers.get('authorization'), deps.config.reconcileSecret)) {
    deps.log.warn('reconcile.unauthorized')
    return json(401, { ok: false })
  }

  const started = Date.now()
  const origin = deps.config.siteUrl || new URL(request.url).origin

  // Optional body lets local tooling shrink the "how old counts as stale" window; the real
  // hourly trigger sends no body and gets the normal 60-minute threshold.
  let olderThanMinutes = 60
  try {
    const text = await request.text()
    if (text) {
      const parsed = JSON.parse(text) as { olderThanMinutes?: unknown }
      if (typeof parsed.olderThanMinutes === 'number' && parsed.olderThanMinutes >= 0) olderThanMinutes = parsed.olderThanMinutes
    }
  } catch {
    // ignore malformed body — use the default window
  }

  const counts: Record<PaymentOutcome | 'errors' | 'checked', number> = { checked: 0, success: 0, pending: 0, failed: 0, abandoned: 0, reversed: 0, review: 0, not_found: 0, errors: 0 }

  let pending: { reference: string }[] = []
  try {
    pending = (await deps.sheets.call<{ payments: { reference: string }[] }>('listPendingPayments', { olderThanMinutes, limit: 20 })).payments
  } catch (err) {
    deps.log.error('reconcile.list_failed', { code: err instanceof SheetsError ? err.code : 'UNEXPECTED' })
    return json(502, { ok: false })
  }

  for (const p of pending) {
    if (Date.now() - started > timeBudgetMs) break
    counts.checked++
    try {
      const v = await deps.paystack.verify(p.reference)
      if (!v.found) {
        // Recorded locally but unknown to Paystack: the applicant never reached checkout
        await deps.sheets.call('recordPaymentResult', { reference: p.reference, status: 'Abandoned', event: 'reconcile:not_found_at_paystack' })
        counts.not_found++
        continue
      }
      const applied = await applyPaystackResult(p.reference, v.transaction, deps, 'reconcile', origin)
      counts[applied.outcome]++
    } catch (err) {
      counts.errors++
      deps.log.warn('reconcile.item_failed', { applicationId: p.reference.slice(0, 15), code: err instanceof SheetsError || err instanceof PaystackError ? err.code : 'UNEXPECTED' })
    }
  }

  deps.log.info('reconcile.done', { detail: JSON.stringify(counts) })
  return json(200, { ok: true, ...counts, remaining: pending.length - counts.checked })
}

