/**
 * Server-only configuration, read from Vercel environment variables.
 * This module must never be imported by browser code (src/).
 */

export type ServerConfig = {
  sheetsEndpoint: string
  sheetsSecret: string
  signingSecret: string
  siteUrl: string
  emailApiKey: string
  emailFrom: string
  admissionsEmail: string
  paystackSecretKey: string
  reconcileSecret: string
}

export function readConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  return {
    sheetsEndpoint: env.GOOGLE_SHEETS_ENDPOINT ?? '',
    sheetsSecret: env.GOOGLE_SHEETS_SECRET ?? '',
    signingSecret: env.APP_SIGNING_SECRET ?? '',
    siteUrl: (env.VITE_SITE_URL ?? '').replace(/\/$/, ''),
    emailApiKey: env.EMAIL_PROVIDER_API_KEY ?? '',
    emailFrom: env.EMAIL_FROM ?? '',
    admissionsEmail: env.ADMISSIONS_NOTIFY_EMAIL ?? '',
    paystackSecretKey: env.PAYSTACK_SECRET_KEY ?? '',
    reconcileSecret: env.RECONCILE_SECRET ?? '',
  }
}

/** Lists missing required settings by name only (values are never logged) */
export function missingForSubmissions(c: ServerConfig): string[] {
  const missing: string[] = []
  if (!/^https:\/\/script\.google\.com\//.test(c.sheetsEndpoint)) missing.push('GOOGLE_SHEETS_ENDPOINT')
  if (c.sheetsSecret.length < 32) missing.push('GOOGLE_SHEETS_SECRET')
  if (c.signingSecret.length < 32) missing.push('APP_SIGNING_SECRET')
  return missing
}

export function missingForPayments(c: ServerConfig): string[] {
  const missing = missingForSubmissions(c)
  if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(c.paystackSecretKey)) missing.push('PAYSTACK_SECRET_KEY')
  return missing
}
