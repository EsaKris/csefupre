/**
 * Validation primitives shared by the browser (for immediate feedback) and the
 * /api serverless functions (the real security boundary). Never rely on the
 * browser-side check alone.
 */
import { z } from 'zod'

/** Remove control characters and collapse whitespace. Output is still escaped by React / the data layer. */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/** Normalise a phone number to digits with an optional leading + */
export function normalisePhone(value: string): string {
  const trimmed = value.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/[^\d]/g, '')
}

/** Nigerian local (0XXXXXXXXXX), +234 format, or international E.164-style */
export function isValidPhone(value: string): boolean {
  const n = normalisePhone(value)
  if (/^0[789][01]\d{8}$/.test(n)) return true
  // Numbers using Nigeria's country code must follow the Nigerian mobile format
  if (n.startsWith('+234')) return /^\+234[789][01]\d{8}$/.test(n)
  return /^\+[1-9]\d{7,14}$/.test(n)
}

export const text = (label: string, { min = 1, max }: { min?: number; max: number }) =>
  z
    .string({ error: `Enter your ${label}` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, { error: `Enter your ${label}` })
        .min(min, { error: `${capitalise(label)} must be at least ${min} characters` })
        .max(max, { error: `${capitalise(label)} must be ${max} characters or fewer` }),
    )

export const email = z
  .string({ error: 'Enter your email address' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'Enter your email address' })
  .max(254, { error: 'Email address is too long' })
  .pipe(z.email({ error: 'Enter a valid email address, like name@example.com' }))

export const phone = z
  .string({ error: 'Enter your phone number' })
  .trim()
  .min(1, { error: 'Enter your phone number' })
  .refine(isValidPhone, { error: 'Enter a valid phone number, like 0802 848 7246 or +234 802 848 7246' })
  .transform(normalisePhone)

export const optionalPhone = z
  .string()
  .trim()
  .max(24)
  .refine((v) => v === '' || isValidPhone(v), { error: 'Enter a valid phone number, or leave this blank' })
  .transform((v) => (v === '' ? '' : normalisePhone(v)))

/** Honeypot: real users never see or fill this field */
export const HONEYPOT_FIELD = 'companyWebsite'

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Flatten zod issues to { field: firstMessage } for form display */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
