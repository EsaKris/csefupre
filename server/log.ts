/**
 * Structured server logging.
 * Only event names, codes and record IDs are logged — never names, emails,
 * phone numbers, addresses, secrets or request bodies.
 */

type Level = 'info' | 'warn' | 'error'
type Context = { applicationId?: string; enquiryId?: string; code?: string; status?: number; detail?: string }

export type Logger = { info: (event: string, ctx?: Context) => void; warn: (event: string, ctx?: Context) => void; error: (event: string, ctx?: Context) => void }

function emit(level: Level, event: string, ctx: Context = {}) {
  const line = JSON.stringify({ level, event, ...ctx, at: new Date().toISOString() })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const log: Logger = {
  info: (e, c) => emit('info', e, c),
  warn: (e, c) => emit('warn', e, c),
  error: (e, c) => emit('error', e, c),
}

/** Reduce an unknown error to a safe, short description (no stack, no payload) */
export function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 200)
  return 'Unknown error'
}
