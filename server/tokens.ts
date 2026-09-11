/**
 * Short-lived signed tokens that let the payment page load an application
 * immediately after submission, without putting the Application ID and
 * email in the URL. Format: base64url(payload).base64url(HMAC-SHA256)
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TTL_SECONDS = 2 * 60 * 60

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url')
}

function sign(data: string, secret: string) {
  return createHmac('sha256', secret).update(data).digest()
}

export function signResumeToken(applicationId: string, secret: string, { ttlSeconds = DEFAULT_TTL_SECONDS, now = Date.now() } = {}) {
  if (secret.length < 32) throw new Error('Signing secret too short')
  const payload = b64url(JSON.stringify({ aid: applicationId, exp: Math.floor(now / 1000) + ttlSeconds, v: 1 }))
  return `${payload}.${b64url(sign(payload, secret))}`
}

export function verifyResumeToken(token: unknown, secret: string, { now = Date.now() } = {}): { applicationId: string } | null {
  if (typeof token !== 'string' || token.length > 512 || secret.length < 32) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload, secret)
  const given = Buffer.from(signature, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (data.v !== 1 || typeof data.aid !== 'string' || typeof data.exp !== 'number') return null
    if (data.exp < Math.floor(now / 1000)) return null
    return { applicationId: data.aid }
  } catch {
    return null
  }
}
