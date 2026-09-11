/**
 * Paystack integration (server-only).
 * API reference: https://paystack.com/docs/api/transaction/
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PaymentOutcome, SheetPaymentStatus } from '../shared/schemas/payment.js'

export class PaystackError extends Error {
  constructor(public code: string, public httpStatus?: number) {
    super(`Paystack error: ${code}`)
  }
}

export type PaystackTransaction = {
  id: number
  status: string
  reference: string
  amount: number
  currency: string
  paid_at: string | null
  channel: string | null
  metadata?: unknown
  customer?: { email?: string }
}

export type PaystackClient = {
  initialize(input: {
    email: string
    amountKobo: number
    reference: string
    callbackUrl: string
    metadata: Record<string, unknown>
  }): Promise<{ authorizationUrl: string; reference: string }>
  verify(reference: string): Promise<{ found: true; transaction: PaystackTransaction } | { found: false }>
}

const API = 'https://api.paystack.co'

export function createPaystackClient({ secretKey, fetchImpl = fetch, timeoutMs = 15000 }: { secretKey: string; fetchImpl?: typeof fetch; timeoutMs?: number }): PaystackClient {
  async function request(path: string, init: RequestInit) {
    let res: Response
    try {
      res = await fetchImpl(`${API}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (err) {
      throw new PaystackError(err instanceof Error && err.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK')
    }
    let body: { status?: boolean; message?: string; data?: any } = {}
    try {
      body = await res.json()
    } catch {
      throw new PaystackError('BAD_RESPONSE', res.status)
    }
    return { res, body }
  }

  return {
    async initialize({ email, amountKobo, reference, callbackUrl, metadata }) {
      const { res, body } = await request('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({ email, amount: amountKobo, currency: 'NGN', reference, callback_url: callbackUrl, metadata }),
      })
      if (!res.ok || !body.status || !body.data?.authorization_url) throw new PaystackError('INITIALIZE_FAILED', res.status)
      return { authorizationUrl: String(body.data.authorization_url), reference: String(body.data.reference ?? reference) }
    },

    async verify(reference) {
      const { res, body } = await request(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' })
      if (res.status === 404 || (res.status === 400 && /not found/i.test(body.message ?? ''))) return { found: false }
      if (!res.ok || !body.status || !body.data) throw new PaystackError('VERIFY_FAILED', res.status)
      return { found: true, transaction: body.data as PaystackTransaction }
    },
  }
}

/** Validates the x-paystack-signature header: HMAC-SHA512 of the raw body with the secret key. */
export function isValidPaystackSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature || !secretKey || !/^[a-f0-9]{128}$/i.test(signature)) return false
  const expected = createHmac('sha512', secretKey).update(rawBody, 'utf8').digest()
  const given = Buffer.from(signature, 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

const STATUS_MAP: Record<string, SheetPaymentStatus> = {
  success: 'Success',
  failed: 'Failed',
  abandoned: 'Abandoned',
  ongoing: 'Ongoing',
  pending: 'Pending',
  processing: 'Processing',
  queued: 'Queued',
  reversed: 'Reversed',
}

export type Assessment =
  | { ok: true; sheetStatus: SheetPaymentStatus; outcome: PaymentOutcome }
  | { ok: false; reason: 'reference_mismatch' | 'currency_mismatch' | 'amount_mismatch' | 'application_mismatch' }

/**
 * Decides what a Paystack transaction means for us. A "success" only counts when the
 * reference, application, currency and amount all match what the server expected.
 */
export function assessTransaction(
  tx: PaystackTransaction,
  expected: { reference: string; applicationId: string; amountKobo: number | null },
): Assessment {
  if (tx.reference !== expected.reference) return { ok: false, reason: 'reference_mismatch' }
  const metaId = (tx.metadata as { applicationId?: unknown } | undefined)?.applicationId
  if (metaId !== undefined && metaId !== expected.applicationId) return { ok: false, reason: 'application_mismatch' }

  const sheetStatus = STATUS_MAP[String(tx.status).toLowerCase()] ?? 'Pending'
  if (sheetStatus === 'Success') {
    if (String(tx.currency).toUpperCase() !== 'NGN') return { ok: false, reason: 'currency_mismatch' }
    if (expected.amountKobo === null || Number(tx.amount) !== expected.amountKobo) return { ok: false, reason: 'amount_mismatch' }
  }
  return { ok: true, sheetStatus, outcome: outcomeFor(sheetStatus) }
}

export function outcomeFor(status: SheetPaymentStatus | string): PaymentOutcome {
  switch (status) {
    case 'Success':
      return 'success'
    case 'Failed':
      return 'failed'
    case 'Abandoned':
      return 'abandoned'
    case 'Reversed':
      return 'reversed'
    default:
      return 'pending'
  }
}

/** New unique reference for one payment attempt */
export function newPaymentReference(applicationId: string, random: () => string): string {
  return `${applicationId}-P${random()}`
}

/** Only redirect applicants to Paystack's own checkout (plus explicitly allowed local dev origins) */
export function isAllowedCheckoutUrl(url: string, extraOrigins: string[] = []): boolean {
  try {
    const u = new URL(url)
    if (u.protocol === 'https:' && (u.hostname === 'checkout.paystack.com' || u.hostname.endsWith('.paystack.com'))) return true
    return extraOrigins.includes(u.origin)
  } catch {
    return false
  }
}
