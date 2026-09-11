/**
 * In-progress application storage.
 *
 * Uses sessionStorage (not localStorage): the draft survives a page reload
 * but is discarded when the tab is closed, and it is cleared on successful
 * submission. This matches the Privacy Policy. No payment data is ever stored.
 */
import { emptyApplication, type ApplicationFormValues } from '../../shared/schemas/application'

const DRAFT_KEY = 'cse.application.draft.v1'
const PAYMENT_SESSION_KEY = 'cse.payment.session.v1'

export type ApplicationDraft = {
  values: ApplicationFormValues
  maxStep: number
  submissionId: string
  savedAt: string
}

function storage(): Storage | null {
  try {
    const s = window.sessionStorage
    s.setItem('__cse_test', '1')
    s.removeItem('__cse_test')
    return s
  } catch {
    return null
  }
}

export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function loadDraft(): ApplicationDraft | null {
  const s = storage()
  if (!s) return null
  try {
    const raw = s.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ApplicationDraft>
    if (!parsed.values || typeof parsed.submissionId !== 'string') return null
    // Merge onto the empty shape so drafts from older form versions stay valid
    const values = { ...emptyApplication }
    for (const key of Object.keys(emptyApplication) as (keyof ApplicationFormValues)[]) {
      const v = (parsed.values as Record<string, unknown>)[key]
      if (typeof v === typeof emptyApplication[key]) (values as Record<string, unknown>)[key] = v
    }
    return {
      values,
      maxStep: Math.min(Math.max(Number(parsed.maxStep) || 1, 1), 5),
      submissionId: parsed.submissionId,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: Omit<ApplicationDraft, 'savedAt'>): void {
  storage()?.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }))
}

export function clearDraft(): void {
  storage()?.removeItem(DRAFT_KEY)
}

export function isDraftEmpty(values: ApplicationFormValues): boolean {
  return (Object.keys(emptyApplication) as (keyof ApplicationFormValues)[]).every((k) => values[k] === emptyApplication[k])
}

/** Handoff from the application form to the payment page (Phase 5). Contains no personal details. */
export type PaymentSession = { applicationId: string; resumeToken: string }

export function savePaymentSession(session: PaymentSession): void {
  storage()?.setItem(PAYMENT_SESSION_KEY, JSON.stringify(session))
}

export function loadPaymentSession(): PaymentSession | null {
  try {
    const raw = storage()?.getItem(PAYMENT_SESSION_KEY)
    return raw ? (JSON.parse(raw) as PaymentSession) : null
  } catch {
    return null
  }
}

export function clearPaymentSession(): void {
  storage()?.removeItem(PAYMENT_SESSION_KEY)
}
