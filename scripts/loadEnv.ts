/**
 * Minimal .env loader for build-time Node scripts (no dependency needed).
 * Mirrors Vite's precedence: .env.local overrides .env. Vercel's real
 * environment variables always win — this never overwrites an already-set
 * process.env value.
 */
import { readFileSync, existsSync } from 'node:fs'

function parse(content: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

export function loadLocalEnv() {
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue
    const vars = parse(readFileSync(file, 'utf8'))
    for (const [key, value] of Object.entries(vars)) {
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}
