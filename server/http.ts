/** HTTP helpers for Vercel Functions (Web Request/Response API). */

const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...headers } })
}

export const MESSAGES = {
  generic: 'We could not complete your request at this time. Please try again, or contact admissions at cse@fupre.edu.ng.',
  rateLimited: 'Too many attempts. Please wait a few minutes and try again.',
  invalid: 'Some of your answers need attention.',
}

/**
 * Rejects cross-site requests. Browsers always send Origin on cross-origin POSTs;
 * we require it to match the host the request was sent to.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    // Non-browser clients omit Origin. Require the JSON content type instead (checked separately).
    return true
  }
  try {
    const originHost = new URL(origin).host
    const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host
    return originHost === requestHost
  } catch {
    return false
  }
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

type BodyResult = { ok: true; data: Record<string, unknown> } | { ok: false; response: Response }

/** Reads a JSON object body with a size limit. Requires Content-Type: application/json. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<BodyResult> {
  const type = request.headers.get('content-type') ?? ''
  if (!type.toLowerCase().startsWith('application/json')) {
    return { ok: false, response: json(415, { ok: false, message: MESSAGES.generic }) }
  }
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > maxBytes) return { ok: false, response: json(413, { ok: false, message: MESSAGES.generic }) }

  let text: string
  try {
    text = await request.text()
  } catch {
    return { ok: false, response: json(400, { ok: false, message: MESSAGES.generic }) }
  }
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, response: json(413, { ok: false, message: MESSAGES.generic }) }
  }
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return { ok: true, data: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, response: json(400, { ok: false, message: MESSAGES.generic }) }
  }
}

export function methodNotAllowed(allow: string): Response {
  return json(405, { ok: false, message: 'Method not allowed' }, { Allow: allow })
}
