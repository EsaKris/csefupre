/**
 * Runs apps-script/Code.gs in Node against an in-memory spreadsheet.
 * Used by unit tests and the local development API server.
 * NOT used in production — production calls the deployed Apps Script Web App.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

type Cell = string | number | Date | boolean

/** Chainable no-op for formatting calls the harness does not need to emulate */
function noop(): any {
  const fn: any = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'then' ? undefined : fn),
    apply: () => fn,
  })
  return fn
}

class MockSheet {
  data: Cell[][] = []
  constructor(public name: string) {}
  getLastRow() {
    return this.data.length
  }
  getLastColumn() {
    return this.data.reduce((m, r) => Math.max(m, r.length), 0)
  }
  getMaxRows() {
    return 1000
  }
  appendRow(row: Cell[]) {
    this.data.push(row.map(storeValue))
    return this
  }
  getRange(row: number, col: number, numRows = 1, numCols = 1) {
    const sheet = this
    const range: any = {
      getValues() {
        const out: Cell[][] = []
        for (let r = 0; r < numRows; r++) {
          const src = sheet.data[row - 1 + r] ?? []
          const line: Cell[] = []
          for (let c = 0; c < numCols; c++) line.push(src[col - 1 + c] ?? '')
          out.push(line)
        }
        return out
      },
      setValue(value: Cell) {
        return range.setValues([[value]])
      },
      setValues(values: Cell[][]) {
        values.forEach((line, r) => {
          const idx = row - 1 + r
          while (sheet.data.length <= idx) sheet.data.push([])
          line.forEach((v, c) => {
            const target = sheet.data[idx]
            while (target.length < col - 1 + c) target.push('')
            target[col - 1 + c] = storeValue(v)
          })
        })
        return range
      },
    }
    return new Proxy(range, { get: (t, p) => (p in t ? t[p] : noop()) })
  }
}

/** Emulates Sheets: a leading apostrophe marks literal text and is not stored as a visible character */
function storeValue(v: Cell): Cell {
  if (typeof v === 'string' && v.startsWith("'")) return v.slice(1)
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) throw new Error(`Formula-like value written without text escaping: ${v}`)
  return v
}

/** Unimplemented sheet methods (formatting, freezing) become chainable no-ops */
function withNoops<T extends object>(target: T): T {
  return new Proxy(target, {
    get: (t, p, r) => (p in t ? (typeof (t as any)[p] === 'function' ? (t as any)[p].bind(t) : Reflect.get(t, p, r)) : noop()),
  })
}

export type Harness = ReturnType<typeof createAppsScriptHarness>

export function createAppsScriptHarness({ secret = 'x'.repeat(40) }: { secret?: string } = {}) {
  const sheets = new Map<string, MockSheet>()
  const props = new Map<string, string>([['SHARED_SECRET', secret]])

  const spreadsheet = new Proxy(
    {
      getSheetByName: (n: string) => (sheets.has(n) ? withNoops(sheets.get(n)!) : null),
      insertSheet: (n: string) => {
        const s = new MockSheet(n)
        sheets.set(n, s)
        return withNoops(s)
      },
    } as Record<string, unknown>,
    { get: (t, p) => (p in t ? t[p as string] : noop()) },
  )

  const triggers: { handlerFunction: string }[] = []

  const context = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    RegExp,
    String,
    parseInt,
    isNaN,
    Error,
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, newDataValidation: () => noop() },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => props.get(k) ?? null,
        setProperty: (k: string, v: string) => props.set(k, v),
      }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => undefined, releaseLock: () => undefined }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content: string) => ({ content, setMimeType() { return this } }),
    },
    Utilities: {
      formatDate: (d: Date, tz: string, fmt: string) => {
        if (fmt !== 'yyyy') throw new Error('harness supports yyyy only')
        return new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric' }).format(d)
      },
    },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => '{}' }) },
    ScriptApp: {
      AuthMode: { FULL: 'FULL', LIMITED: 'LIMITED', NONE: 'NONE' },
      AuthorizationStatus: { REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED', ENABLED: 'ENABLED' },
      getAuthorizationInfo: () => ({ getAuthorizationStatus: () => 'ENABLED' }),
      getProjectTriggers: () => triggers.map((t) => ({ getHandlerFunction: () => t.handlerFunction })),
      deleteTrigger: (t: { getHandlerFunction: () => string }) => {
        const i = triggers.findIndex((x) => x.handlerFunction === t.getHandlerFunction())
        if (i !== -1) triggers.splice(i, 1)
      },
      newTrigger: (handlerFunction: string) => ({
        timeBased: () => ({
          everyHours: () => ({
            create: () => {
              triggers.push({ handlerFunction })
            },
          }),
        }),
      }),
    },
  })

  const codePath = fileURLToPath(new URL('../../apps-script/Code.gs', import.meta.url))
  vm.runInContext(readFileSync(codePath, 'utf8'), context, { filename: 'Code.gs' })

  /** Simulate an HTTP POST to the deployed web app */
  function post(body: unknown): any {
    const out = (context as any).doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } })
    return JSON.parse(out.content)
  }

  return {
    secret,
    post,
    call: (action: string, payload: unknown) => post({ secret, action, payload }),
    sheet: (name: string) => sheets.get(name),
    /** Rows as objects keyed by header */
    records: (name: string) => {
      const s = sheets.get(name)
      if (!s || s.data.length === 0) return []
      const [headers, ...rows] = s.data
      return rows.map((r) => Object.fromEntries(headers.map((h, i) => [String(h), r[i] ?? ''])))
    },
    props,
    run: (fnName: string) => (context as any)[fnName](),
  }
}
