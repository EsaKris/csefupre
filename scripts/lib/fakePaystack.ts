/**
 * In-memory stand-in for Paystack, for tests and local development ONLY.
 * Mirrors the real API's behaviour closely enough to exercise our flow:
 *  - newly initialised transactions verify as "abandoned" until the customer acts
 *  - verify of an unknown reference returns "not found"
 *  - webhooks are signed with HMAC-SHA512 like Paystack's
 */
import { createHmac } from 'node:crypto'
import type { PaystackClient, PaystackTransaction } from '../../server/paystack'

export type FakePaystack = PaystackClient & {
  transactions: Map<string, PaystackTransaction & { email: string; callbackUrl: string; initializedAt: number }>
  initializeCalls: number
  verifyCalls: number
  /** Simulate what the customer does on the checkout page */
  settle: (reference: string, status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'reversed', overrides?: Partial<PaystackTransaction>) => PaystackTransaction
  /** Build a signed charge.success webhook body exactly as Paystack would send it */
  webhookFor: (reference: string) => { raw: string; signature: string }
  failNext: (what: 'initialize' | 'verify') => void
}

export function createFakePaystack({ secretKey, checkoutBase = 'https://checkout.paystack.com' }: { secretKey: string; checkoutBase?: string }): FakePaystack {
  const transactions: FakePaystack['transactions'] = new Map()
  let nextId = 5_000_001
  const failures = new Set<string>()

  const fake: FakePaystack = {
    transactions,
    initializeCalls: 0,
    verifyCalls: 0,

    async initialize({ email, amountKobo, reference, callbackUrl, metadata }) {
      fake.initializeCalls++
      if (failures.delete('initialize')) throw Object.assign(new Error('fake initialize failure'), { code: 'INITIALIZE_FAILED' })
      if (transactions.has(reference)) throw new Error('Duplicate Transaction Reference')
      transactions.set(reference, {
        id: nextId++,
        status: 'abandoned',
        reference,
        amount: amountKobo,
        currency: 'NGN',
        paid_at: null,
        channel: null,
        metadata,
        customer: { email },
        email,
        callbackUrl,
        initializedAt: Date.now(),
      })
      const url = checkoutBase.includes('paystack.com') ? `${checkoutBase}/fake${reference.slice(-8).toLowerCase()}` : `${checkoutBase}/__dev/paystack/checkout?reference=${encodeURIComponent(reference)}`
      return { authorizationUrl: url, reference }
    },

    async verify(reference) {
      fake.verifyCalls++
      if (failures.delete('verify')) {
        const { PaystackError } = await import('../../server/paystack')
        throw new PaystackError('TIMEOUT')
      }
      const tx = transactions.get(reference)
      if (!tx) return { found: false }
      const { email: _e, callbackUrl: _c, initializedAt: _i, ...publicTx } = tx
      return { found: true, transaction: { ...publicTx } }
    },

    settle(reference, status, overrides = {}) {
      const tx = transactions.get(reference)
      if (!tx) throw new Error(`Unknown reference ${reference}`)
      tx.status = status
      if (status === 'success') {
        tx.paid_at = new Date().toISOString()
        tx.channel = 'card'
      }
      Object.assign(tx, overrides)
      return tx
    },

    webhookFor(reference) {
      const tx = transactions.get(reference)
      if (!tx) throw new Error(`Unknown reference ${reference}`)
      const { email: _e, callbackUrl: _c, initializedAt: _i, ...data } = tx
      const raw = JSON.stringify({ event: 'charge.success', data })
      return { raw, signature: createHmac('sha512', secretKey).update(raw).digest('hex') }
    },

    failNext(what) {
      failures.add(what)
    },
  }
  return fake
}
