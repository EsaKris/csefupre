/**
 * FEES — single source of truth.
 *
 * This file is read by the website (to DISPLAY fees) and by the /api payment
 * functions (to CHARGE fees). The server always uses these values; any amount
 * sent from the browser is ignored.
 *
 * Amounts are whole Naira (e.g. 25000 for ₦25,000). Paystack's kobo conversion
 * happens on the server.
 *
 * `null` means "not yet confirmed by the Centre":
 *   - the website shows "To be confirmed"
 *   - the server refuses to start a payment for that item
 *
 * ⚠ The amounts below are SAMPLE PLACEHOLDERS for development and review.
 *   While FEES_ARE_PLACEHOLDERS is true:
 *   - every displayed fee carries a visible "Sample fee" tag
 *   - the server refuses to take payment with a LIVE Paystack key (test mode still works)
 *   Replace every amount with the Centre's approved figures, then set the flag to false.
 */
import type { CourseSlug, ProgrammeSlug } from './catalog.js'

export const CURRENCY = 'NGN' as const

/** Set to false only after every amount below has been replaced with an approved figure. */
export const FEES_ARE_PLACEHOLDERS = true

/**
 * Application fee for each programme — CONFIRMED figures.
 * FEES_ARE_PLACEHOLDERS stays true above only because COURSE_FEES below are still samples;
 * once those are confirmed too, flip the flag and these amounts go live as-is.
 */
export const APPLICATION_FEES: Record<ProgrammeSlug, number | null> = {
  'professional-diploma': 20000,
  pgd: 25000,
  masters: 35000,
  phd: 35000,
}

/** Fee for each short / professional course. Each course is priced individually. STILL SAMPLES. */
export const COURSE_FEES: Record<CourseSlug, number | null> = {
  ims: 180000,
  'iso-9001': 120000,
  'iso-14001': 125000,
  'iso-45001': 135000,
  'competent-person': 95000,
  'defensive-driving': 45000,
  'h2s-safety': 60000,
  'confined-space-entry': 65000,
  'safety-managers-workshop': 150000,
  'safety-officers-course': 110000,
  'incident-accident-investigation': 85000,
  'oil-spill-contingency-response': 140000,
}

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

export function formatNaira(amount: number): string {
  return naira.format(amount)
}

/** Server helper: convert a confirmed Naira amount to kobo for Paystack. */
export function toKobo(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Fee must be a positive whole Naira amount')
  return amount * 100
}

/**
 * Server guard (used by payment initialization in Phase 5):
 * sample fees may be charged in Paystack TEST mode only.
 */
export function assertFeesAllowedForKey(paystackSecretKey: string): void {
  if (FEES_ARE_PLACEHOLDERS && paystackSecretKey.startsWith('sk_live_')) {
    throw new Error('Sample fees are configured (FEES_ARE_PLACEHOLDERS = true). Set approved fees before using a live Paystack key.')
  }
}
