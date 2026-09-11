/**
 * Payment contracts shared by the payment pages and the /api/payments + /api/paystack functions.
 */
import { z } from 'zod'
import { email } from '../validation.js'

export const APPLICATION_ID_PATTERN = /^CSE-\d{4}-\d{6}$/
/** Our Paystack references: <Application ID>-P<random>, e.g. CSE-2026-000001-PK3J9Q2XA */
export const PAYMENT_REFERENCE_PATTERN = /^CSE-\d{4}-\d{6}-P[A-Z0-9]{6,24}$/

export const paymentLookupSchema = z.object({
  applicationId: z
    .string({ error: 'Enter your Application ID' })
    .trim()
    .toUpperCase()
    .min(1, { error: 'Enter your Application ID' })
    .regex(APPLICATION_ID_PATTERN, { error: 'Enter your Application ID in the format CSE-2026-000001' }),
  email,
})
export type PaymentLookup = z.input<typeof paymentLookupSchema>

/** Sheet payment statuses */
export const SHEET_PAYMENT_STATUSES = ['Not Started', 'Pending', 'Ongoing', 'Processing', 'Queued', 'Success', 'Failed', 'Abandoned', 'Reversed'] as const
export type SheetPaymentStatus = (typeof SHEET_PAYMENT_STATUSES)[number]

export type PaymentApplicationSummary = {
  applicationId: string
  applicantName: string
  programme: string
  programmeName: string
  /** Whole Naira, or null when the fee is not yet set */
  fee: number | null
  paymentStatus: SheetPaymentStatus | string
  /** Present only when payment has succeeded, to link to the confirmation */
  paidReference?: string
}

export type PaymentSummaryResult =
  | { status: 'found'; application: PaymentApplicationSummary; resumeToken: string }
  | { status: 'not_found' }

export type InitializePaymentResult =
  | { status: 'redirect'; authorizationUrl: string; reference: string }
  | { status: 'already_paid' }
  | { status: 'fee_unavailable' }

/** What the applicant sees after returning from Paystack */
export type PaymentOutcome = 'success' | 'pending' | 'failed' | 'abandoned' | 'reversed' | 'review' | 'not_found'

export type VerifyPaymentResult = {
  outcome: PaymentOutcome
  reference: string
  applicationId?: string
  programmeName?: string
  /** Whole Naira */
  amount?: number
  paidAt?: string | null
}
