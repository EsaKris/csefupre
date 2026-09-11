/**
 * Client for the Google Apps Script data layer (apps-script/Code.gs).
 * The shared secret is sent in the request body because Apps Script web apps
 * cannot read custom request headers.
 */

export class SheetsError extends Error {
  constructor(public code: string) {
    super(`Sheets data layer error: ${code}`)
  }
}

export type SheetsClient = {
  call: <T = Record<string, unknown>>(action: string, payload: Record<string, unknown>) => Promise<T>
}

export function createHttpSheetsClient({
  endpoint,
  secret,
  timeoutMs = 15000,
  fetchImpl = fetch,
}: {
  endpoint: string
  secret: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}): SheetsClient {
  return {
    async call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
      let res: Response
      try {
        res = await fetchImpl(endpoint, {
          method: 'POST',
          // text/plain avoids an unnecessary CORS preflight path on Google's side; body is JSON
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ secret, action, payload }),
          // Apps Script answers with a 302 to googleusercontent.com; fetch follows it with GET, as required
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (err) {
        throw new SheetsError(err instanceof Error && err.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK')
      }
      if (!res.ok) throw new SheetsError(`HTTP_${res.status}`)
      let body: { ok?: boolean; code?: string } & Record<string, unknown>
      try {
        body = await res.json()
      } catch {
        throw new SheetsError('BAD_RESPONSE')
      }
      if (!body.ok) throw new SheetsError(body.code ?? 'UNKNOWN')
      return body as T
    },
  }
}
