import type {
  InitializePaymentResult,
  PaymentSummaryResult,
  VerifyPaymentResult,
} from '../../shared/schemas/payment'
import { postJson } from './api'

export function fetchSummaryByToken(resumeToken: string) {
  return postJson<PaymentSummaryResult & { reason?: string }>('/api/payments/summary', { resumeToken }, { timeoutMs: 30000 })
}

export function fetchSummaryByLookup(applicationId: string, email: string) {
  return postJson<PaymentSummaryResult>('/api/payments/summary', { applicationId, email }, { timeoutMs: 30000 })
}

export function startPayment(resumeToken: string) {
  return postJson<InitializePaymentResult>('/api/paystack/initialize', { resumeToken }, { timeoutMs: 30000 })
}

export function verifyPayment(reference: string) {
  return postJson<VerifyPaymentResult>('/api/paystack/verify', { reference }, { timeoutMs: 30000 })
}

/** Paystack appends ?trxref=…&reference=… to the callback URL */
export function referenceFromSearch(params: URLSearchParams): string {
  return (params.get('reference') || params.get('trxref') || '').trim()
}
