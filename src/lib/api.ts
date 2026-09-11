/**
 * Browser → /api client.
 * Every failure becomes an ApiError carrying a plain-language message.
 * Technical detail is never shown to applicants.
 */

export const GENERIC_ERROR =
  'We could not complete your request at this time. Please try again, or contact admissions at cse@fupre.edu.ng.'

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>
  constructor(message: string, status = 0, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; message?: string; fieldErrors?: Record<string, string> }

export async function postJson<T>(path: string, body: unknown, { timeoutMs = 25000 } = {}): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(
      controller.signal.aborted
        ? 'The request took too long. Check your internet connection and try again.'
        : 'We could not reach the server. Check your internet connection and try again.',
    )
  } finally {
    window.clearTimeout(timer)
  }

  let payload: ApiEnvelope<T> | null = null
  try {
    payload = (await res.json()) as ApiEnvelope<T>
  } catch {
    payload = null
  }

  if (res.ok && payload && payload.ok) return payload.data
  if (payload && !payload.ok) {
    throw new ApiError(payload.message || GENERIC_ERROR, res.status, payload.fieldErrors)
  }
  if (res.status === 429) throw new ApiError('Too many attempts. Please wait a few minutes and try again.', 429)
  throw new ApiError(GENERIC_ERROR, res.status)
}
