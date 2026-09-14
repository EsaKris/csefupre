# Security

A consolidated record of how this site meets each security requirement from the original
brief, plus the CSP trade-off decision and how to verify everything yourself.

---

## Checklist

| Requirement | How it's met |
|---|---|
| HTTPS everywhere | Automatic on Vercel. `Strict-Transport-Security` header forces it (`vercel.json`). |
| Environment variables for all secrets | See `.env.example`. Every secret is server-only; only `VITE_SITE_URL` is frontend-safe. |
| No secret keys in frontend | Verified by an automated bundle scan (below) at the end of every phase. |
| Input validation (client + server) | Shared zod schemas in `shared/schemas/` run in the browser for UX and again on the server as the real check — the browser is never trusted. |
| Output sanitization | React escapes all rendered text by default. Apps Script stores every value as literal text (`asText_`), so formula-injection payloads (`=HYPERLINK(...)`) display as text, never execute. Email templates HTML-escape every dynamic value (`escapeHtml` in `server/email/templates.ts`). |
| Email / phone validation | `shared/validation.ts` — real email format check, Nigerian and international phone number rules, tested in `tests/application-schema.test.ts`. |
| Rate limiting | Per-IP limits on `/api/applications`, `/api/enquiries`, `/api/paystack/*` (`server/rateLimit.ts`). Documented as best-effort per serverless instance — see note below. |
| Webhook signature validation | `isValidPaystackSignature` — HMAC-SHA512, constant-time comparison. Invalid signatures are rejected before the body is ever parsed. |
| CSRF considerations | All state-changing endpoints require `Content-Type: application/json` (form POSTs can't set this cross-site) and check that the request's `Origin` matches the site's own host (`isSameOrigin` in `server/http.ts`). |
| Secure headers | `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`. |
| Content-Security-Policy | Strict `script-src 'self'` — see the trade-off note below for `style-src`. |
| X-Frame-Options / frame-ancestors | Both set — `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'`. |
| No sensitive info in URLs where avoidable | The application draft and payment session live in `sessionStorage`, never in the URL. The one unavoidable exception is Paystack's own callback (`/payment/status?reference=...`) — Paystack controls that URL shape, and a payment reference alone reveals nothing without also matching records server-side. |
| No payment secret in localStorage | Confirmed — `src/lib/applicationDraft.ts` uses `sessionStorage` exclusively, and only ever stores an Application ID and a short-lived resume token, never card data (which this site never touches at all). |
| No service account credentials in Git | `.gitignore` excludes `.env*` (except `.env.example`). The Google Sheets shared secret and Paystack keys live only in Vercel and Apps Script Script Properties. |
| No unnecessary personal information stored in browser | The application draft holds full applicant details only while the wizard is in progress, and is cleared on submission or when the tab closes — documented in the Privacy Policy. |
| Prevent duplicate application submissions | A random `submissionId` per draft — a retried submit returns the original record instead of creating a second one (`tests/apps-script-payments.test.ts`). |
| Prevent duplicate payment processing | Every payment result is applied idempotently; a successful payment can never be silently downgraded by a stale status; duplicate webhooks change nothing after the first (`tests/payments.test.ts`). |
| Server-side amount validation | The application fee is read from `shared/fees.ts` on the server and never accepted from the browser. A Paystack transaction is only accepted as successful when its amount and currency match what the server expects (`assessTransaction` in `server/paystack.ts`). |

---

## The one deliberate trade-off: `style-src 'unsafe-inline'`

`script-src` is strict — `'self'` only, no `unsafe-inline`, no `unsafe-eval`, no external hosts.
That's the directive that actually stops an XSS payload from running arbitrary code, and it's
enforced without exception.

`style-src` includes `'unsafe-inline'`. Two places in the UI set a genuine inline `style`
attribute — the custom select-arrow icon (`src/components/forms/Field.tsx`) and the homepage
programme ladder's staggered animation delay (`src/components/home/HomeHero.tsx`). Both are
static, developer-written values with no user input anywhere near them — there's no way for an
attacker to inject a value into either. Blocking inline styles site-wide to close a channel that
isn't reachable here didn't seem worth the fragility of a nonce- or hash-based alternative
(which breaks the moment either value changes and needs the CSP header regenerated to match).
This is a common, well-understood trade-off — many production sites take the same position.

If this changes later (e.g. inline styles built from user input are added somewhere), revisit
this before shipping — that would be a real risk this policy doesn't currently need to cover.

## Rate limiting is best-effort, not a guarantee

`server/rateLimit.ts` keeps counts in memory. Vercel serverless functions don't share memory
across instances, so under real concurrent traffic from many different IPs, the limiter only
catches bursts that land on the same warm instance — it's a first line of defence against casual
abuse and simple bots, not a hard ceiling. For a stronger guarantee, add a Vercel Firewall
rate-limit rule on `/api/*`, or swap in a shared store (Upstash Redis is a natural fit — the
`RateLimiter` interface in `server/rateLimit.ts` is deliberately small so this is a drop-in
replacement, not a rewrite).

## Verifying this yourself

```bash
npm run build

# 1. No secrets, server code, or Google/Paystack URLs in what ships to the browser
grep -rlE "sk_test|sk_live|APP_SIGNING_SECRET|GOOGLE_SHEETS_SECRET|PAYSTACK_SECRET_KEY|RECONCILE_SECRET|script\.google\.com|createHmac|timingSafeEqual|SHARED_SECRET" dist/ \
  || echo "clean"

# 2. Headers behave exactly as vercel.json defines, checked with a real browser
npx tsx scripts/serve-with-vercel-headers.ts 4200 &
python3 tests/e2e/integration_phase6.py http://localhost:4200
```

The second command re-checks every header, confirms the CSP causes zero violations while
actually using the site (browsing, submitting a form), and confirms the cache-control split
between hashed bundles and replaceable images/logos.

## Reporting a problem

If you find a security issue in this site, email the developer directly rather than filing a
public issue. Once live, add a contact route here for the Centre's own security reporting
process if one exists.
