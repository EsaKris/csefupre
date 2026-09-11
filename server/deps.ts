import { randomBytes } from 'node:crypto'
import { readConfig, type ServerConfig } from './config.js'
import { createHttpSheetsClient, type SheetsClient } from './sheets.js'
import { createEmailSender, type EmailSender } from './email/send.js'
import { createRateLimiter, type RateLimiter } from './rateLimit.js'
import { createPaystackClient, type PaystackClient } from './paystack.js'
import { log, type Logger } from './log.js'

export type Deps = {
  config: ServerConfig
  sheets: SheetsClient
  paystack: PaystackClient
  sendEmail: EmailSender
  limiters: { applications: RateLimiter; enquiries: RateLimiter; lookups: RateLimiter; payments: RateLimiter }
  log: Logger
  /** Random uppercase alphanumeric string for payment references */
  randomToken: () => string
  /** Extra checkout origins allowed for redirects (local development only; empty in production) */
  allowedCheckoutOrigins: string[]
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function randomToken(length = 10): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

let cached: Deps | null = null

/** Production dependencies, created once per warm serverless instance */
export function defaultDeps(): Deps {
  if (cached) return cached
  const config = readConfig()
  cached = {
    config,
    sheets: createHttpSheetsClient({ endpoint: config.sheetsEndpoint, secret: config.sheetsSecret }),
    paystack: createPaystackClient({ secretKey: config.paystackSecretKey }),
    sendEmail: createEmailSender(config),
    limiters: {
      applications: createRateLimiter({ limit: 8, windowMs: 10 * 60_000 }),
      enquiries: createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }),
      lookups: createRateLimiter({ limit: 10, windowMs: 10 * 60_000 }),
      payments: createRateLimiter({ limit: 30, windowMs: 10 * 60_000 }),
    },
    log,
    randomToken: () => randomToken(10),
    allowedCheckoutOrigins: [],
  }
  return cached
}
