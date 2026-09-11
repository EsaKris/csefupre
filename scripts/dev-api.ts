/**
 * LOCAL DEVELOPMENT ONLY.
 *
 * Serves /api/* with the real request handlers, backed by apps-script/Code.gs
 * running against an in-memory spreadsheet (no Google account needed).
 * Data is lost when the process stops.
 *
 *   npm run dev:api        # terminal 1 — API on http://localhost:3001
 *   npm run dev            # terminal 2 — site on http://localhost:5173 (proxies /api)
 *
 * Inspect stored records at http://localhost:3001/__dev/sheets
 * Payments use a fake Paystack checkout page unless PAYSTACK_SECRET_KEY is a sk_test_ key.
 * Run the abandoned-payment check manually: http://localhost:3001/__dev/reconcile
 * To test against a REAL Google Sheet instead, set GOOGLE_SHEETS_ENDPOINT and
 * GOOGLE_SHEETS_SECRET in .env.local and run with DEV_API_USE_REAL_SHEETS=1.
 */
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { handleApplications } from '../server/handlers/applications'
import { handleEnquiries } from '../server/handlers/enquiries'
import { createRateLimiter } from '../server/rateLimit'
import { createHttpSheetsClient, SheetsError, type SheetsClient } from '../server/sheets'
import { readConfig } from '../server/config'
import { log } from '../server/log'
import type { Deps } from '../server/deps'
import { createAppsScriptHarness } from './lib/appsScriptHarness'
import { createFakePaystack } from './lib/fakePaystack'
import { createPaystackClient } from '../server/paystack'
import { randomToken } from '../server/deps'
import { handlePaymentInitialize, handlePaymentSummary, handlePaymentVerify, handlePaystackWebhook, handleReconcile } from '../server/handlers/payments'

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  console.error('dev-api is for local development only.')
  process.exit(1)
}

const PORT = Number(process.env.DEV_API_PORT ?? 3001)
const useReal = process.env.DEV_API_USE_REAL_SHEETS === '1'
const harness = createAppsScriptHarness()
const env = readConfig()

const sheets: SheetsClient = useReal
  ? createHttpSheetsClient({ endpoint: env.sheetsEndpoint, secret: env.sheetsSecret })
  : {
      async call(action, payload) {
        const r = harness.call(action, payload)
        if (!r.ok) throw new SheetsError(r.code)
        return r
      },
    }

// Paystack: real TEST keys if provided, otherwise the in-memory fake with a clickable dev checkout page
const useRealPaystack = /^sk_test_/.test(env.paystackSecretKey)
const devPaystackKey = useRealPaystack ? env.paystackSecretKey : 'sk_test_' + randomBytes(24).toString('hex')
const reconcileSecret = env.reconcileSecret || randomBytes(24).toString('hex')
const fakePaystack = createFakePaystack({ secretKey: devPaystackKey, checkoutBase: `http://localhost:${PORT}` })
if (/^sk_live_/.test(env.paystackSecretKey)) {
  console.error('Refusing to use a LIVE Paystack key in local development.')
  process.exit(1)
}

const deps: Deps = {
  config: useReal
    ? { ...env, signingSecret: env.signingSecret || randomBytes(32).toString('hex') }
    : {
        ...env,
        sheetsEndpoint: 'https://script.google.com/macros/s/local-dev/exec',
        sheetsSecret: harness.secret,
        signingSecret: randomBytes(32).toString('hex'),
        siteUrl: env.siteUrl,
      },
  sheets,
  paystack: useRealPaystack ? createPaystackClient({ secretKey: devPaystackKey }) : fakePaystack,
  // Emails are printed to the terminal instead of being sent
  sendEmail: async (message, event) => {
    console.log(`\n── email (${event}) → ${message.to}\n   ${message.subject}\n${message.text.split('\n').map((l) => '   ' + l).join('\n')}\n`)
    return { sent: true }
  },
  limiters: {
    applications: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    enquiries: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    lookups: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    payments: createRateLimiter({ limit: 200, windowMs: 60_000 }),
  },
  log,
  randomToken: () => randomToken(10),
  allowedCheckoutOrigins: useRealPaystack ? [] : [`http://localhost:${PORT}`],
}
deps.config = { ...deps.config, paystackSecretKey: devPaystackKey, reconcileSecret }

const routes: Record<string, (r: Request, d: Deps) => Promise<Response>> = {
  '/api/applications': handleApplications,
  '/api/enquiries': handleEnquiries,
  '/api/payments/summary': handlePaymentSummary,
  '/api/paystack/initialize': handlePaymentInitialize,
  '/api/paystack/verify': handlePaymentVerify,
  '/api/paystack/webhook': handlePaystackWebhook,
  '/api/paystack/reconcile': (r, d) => handleReconcile(r, d),
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Fake Paystack checkout page (dev only) */
async function devCheckout(url: URL, res: import('node:http').ServerResponse) {
  const reference = url.searchParams.get('reference') ?? ''
  const tx = fakePaystack.transactions.get(reference)
  if (!tx) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Unknown reference')
    return
  }
  const action = url.searchParams.get('action')
  if (action) {
    const status = action === 'pay' ? 'success' : action === 'fail' ? 'failed' : 'abandoned'
    fakePaystack.settle(reference, status)
    if (status === 'success' && url.searchParams.get('webhook') !== 'skip') {
      const { raw, signature } = fakePaystack.webhookFor(reference)
      const hook = await handlePaystackWebhook(
        new Request(`http://localhost:${PORT}/api/paystack/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-paystack-signature': signature }, body: raw }),
        deps,
      )
      console.log(`[fake paystack] webhook charge.success → HTTP ${hook.status}`)
    }
    const back = new URL(tx.callbackUrl)
    back.searchParams.set('trxref', reference)
    back.searchParams.set('reference', reference)
    res.writeHead(302, { location: back.toString() }).end()
    return
  }
  const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(tx.amount / 100)
  const link = (a: string, extra = '') => `?reference=${encodeURIComponent(reference)}&action=${a}${extra}`
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fake Paystack checkout</title>
<body style="font-family:system-ui;max-width:420px;margin:40px auto;padding:0 16px">
<p style="background:#fbf5e2;border-left:4px solid #c9a233;padding:8px 12px">LOCAL DEVELOPMENT — not real Paystack. No money moves.</p>
<h1 style="margin-bottom:4px">Pay ${escape(naira)}</h1>
<p style="color:#555;margin-top:0">${escape(tx.email)}<br><small>${escape(reference)}</small></p>
<p><a id="pay" href="${link('pay')}" style="display:block;background:#0ba4db;color:#fff;padding:14px;text-align:center;text-decoration:none;border-radius:4px">Pay successfully</a></p>
<p><a id="pay-no-webhook" href="${link('pay', '&webhook=skip')}">Pay successfully (simulate missed webhook)</a></p>
<p><a id="fail" href="${link('fail')}">Card declined (failed)</a></p>
<p><a id="cancel" href="${link('cancel')}">Cancel payment</a></p>
</body>`)
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (url.pathname === '/__dev/sheets') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ Applications: harness.records('Applications'), Payments: harness.records('Payments'), Enquiries: harness.records('Enquiries') }, null, 2))
    return
  }
  if (url.pathname === '/__dev/paystack/checkout' && !useRealPaystack) {
    await devCheckout(url, res)
    return
  }
  if (url.pathname === '/__dev/reconcile') {
    // Trigger the hourly check manually (dev convenience): treats every pending attempt as old enough
    const r = await handleReconcile(
      new Request(`http://localhost:${PORT}/api/paystack/reconcile`, {
        method: 'POST',
        headers: { authorization: `Bearer ${reconcileSecret}`, 'content-type': 'application/json' },
        body: JSON.stringify({ olderThanMinutes: 0 }),
      }),
      deps,
    )
    res.writeHead(r.status, { 'content-type': 'application/json' }).end(await r.text())
    return
  }

  const handler = routes[url.pathname]
  if (!handler) {
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: false, message: 'Not found' }))
    return
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
  // The Vite proxy rewrites Host; restore the browser-facing host for the same-origin check
  if (req.headers['x-forwarded-host']) headers.set('host', String(req.headers['x-forwarded-host']))

  const request = new Request(url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method ?? '') ? undefined : Buffer.concat(chunks) })
  const response = await handler(request, deps)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(PORT, () => {
  console.log(`CSE dev API on http://localhost:${PORT} (${useReal ? 'REAL Google Sheet' : 'in-memory sheet'}, ${useRealPaystack ? 'Paystack TEST mode' : 'fake Paystack checkout'})`)
  console.log(`Records: http://localhost:${PORT}/__dev/sheets`)
})
