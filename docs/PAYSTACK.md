# Paystack payment integration

How application-fee payments work: initialization, verification, the webhook, and the hourly
check for payments the applicant never finished. Written for whoever sets up the Centre's
Paystack account and connects it to this website.

---

## 1. How the flow fits together

```
Applicant clicks              Server initializes           Applicant pays on
"Proceed to Payment"    ──▶   with Paystack, saves    ──▶   Paystack's own
                               a Payments row               checkout page
                                                                   │
                        ┌──────────────────────────────────────────┘
                        ▼
      Paystack sends the applicant back to /payment/status?reference=...
      AND (separately, server-to-server) sends a webhook to /api/paystack/webhook
                        │                                          │
                        ▼                                          ▼
      Server calls Paystack's verify API              Server checks the webhook's
      before showing an outcome page                  signature, then applies the
                        │                              same result                │
                        └──────────────────┬───────────────────────┘
                                            ▼
                          Google Sheet updated (idempotent either way)
                                            │
                                            ▼
                     Hourly: Apps Script asks the server to check any
                     payment still pending after 60 minutes, so an
                     applicant who closes the tab is not lost
```

**Why both a callback and a webhook?** The callback (`/payment/status`) is what the applicant
sees. The webhook is what the *system* relies on — it still arrives even if the applicant closes
the browser tab right after paying, before the callback page loads. Both paths call the same
`applyPaystackResult` function, so they always produce the same outcome.

**Nothing is ever marked successful because a page loaded.** Every outcome comes from a
signature-checked webhook or a direct server-to-server call to Paystack's verify endpoint.

---

## 2. Create the Paystack account

1. Someone with authority to open a business account for the Centre creates the account at
   [paystack.com](https://paystack.com) (or FUPRE's finance office may already have one — ask
   before creating a second one, since settlement goes to whichever account owns the keys).
2. Complete Paystack's business verification. **Live** keys are not issued until this is done;
   **test** keys work immediately and are what this project uses until go-live.
3. In the Paystack dashboard: **Settings → API Keys & Webhooks**. You'll use this screen twice —
   now for the secret key, and again in step 4 for the webhook URL.

## 3. Add the secret key to Vercel

| Variable | Value |
|---|---|
| `PAYSTACK_SECRET_KEY` | The **Secret Key** from Paystack (starts `sk_test_` or `sk_live_`) |

Set this in Vercel: **Project → Settings → Environment Variables**. Use a `sk_test_` key until
you are ready to accept real payments — see §7.

The **public key** is not needed as an environment variable. This integration uses Paystack's
redirect checkout, initialized entirely on the server, so the public key never has to reach the
browser.

## 4. Point Paystack's webhook at this site

1. In Paystack: **Settings → API Keys & Webhooks → Webhook URL**.
2. Enter: `https://<your-domain>/api/paystack/webhook`
3. Save.

Paystack signs every webhook with your secret key (`x-paystack-signature`), and the server
rejects anything that doesn't match — see `isValidPaystackSignature` in `server/paystack.ts`.
No separate webhook secret is needed.

## 5. Set up the hourly abandoned-payment check

This catches the case where an applicant starts paying, closes the tab, and never comes back —
no callback, no webhook, nothing. Left alone, that payment would sit at "Pending" forever.

1. Generate a secret the same way as the others:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Add to Vercel: `RECONCILE_SECRET` = that value.
3. In the Google Apps Script project (see `docs/GOOGLE_SHEETS.md`), open **Project Settings →
   Script properties** and add:
   - `RECONCILE_URL` = `https://<your-domain>/api/paystack/reconcile`
   - `RECONCILE_SECRET` = the **same** value as in Vercel
4. In the Apps Script editor, run the function **`installReconcileTrigger`** once. This schedules
   `reconcilePayments` to run every hour, which calls the URL above with the secret as a bearer
   token.

Why Apps Script and not Vercel Cron: Vercel's free-plan cron schedule is too coarse for an hourly
check, and Apps Script's own time-based trigger is free, reliable, and already authorized for
this project.

What the check does each run:
- Asks the Sheet for payment attempts still `Pending` (etc.) after 60 minutes.
- Asks Paystack directly what actually happened to each one.
- Paid but no webhook arrived → marks it Success and sends the confirmation email, exactly as the
  webhook would have.
- Genuinely never completed → marks it **Abandoned**, sets **Follow-up Status = Pending**, and
  emails the applicant a reminder. The application itself is never deleted.

## 6. The application fee

The amount charged is never sent by the browser. It's read from `shared/fees.ts` on the server —
see that file and the Phase 4 README section on fees. Sample placeholder amounts are in place
now; replace them with the Centre's approved fees, then set `FEES_ARE_PLACEHOLDERS = false`.
Until that flag is `false`, the server refuses to take a payment if `PAYSTACK_SECRET_KEY` is a
**live** key — so a sample price can never accidentally be charged for real.

---

## 7. Testing before going live

Use `sk_test_` keys and Paystack's documented test cards throughout development. A full test
checklist — including the abandoned/duplicate/invalid-webhook cases exercised automatically by
this project's test suite — is in the main **README → Testing** section.

To test locally without any Paystack account at all, `npm run dev:api` uses a **fake Paystack**
checkout page at `/__dev/paystack/checkout` (only in local dev, never in production) — see
`scripts/dev-api.ts` and `scripts/lib/fakePaystack.ts`. It behaves like the real API closely
enough to exercise every code path, including signed webhooks.

If you'd rather test against real Paystack test-mode locally, set `PAYSTACK_SECRET_KEY` to a
`sk_test_` key in `.env.local` — `dev-api` detects this and uses the real Paystack API instead of
the fake one.

## 8. Switching to live payments

1. Confirm `shared/fees.ts` holds the Centre's real, approved fees and `FEES_ARE_PLACEHOLDERS`
   is `false`.
2. In Paystack, switch to **Live** mode and copy the **live** Secret Key.
3. In Vercel, replace `PAYSTACK_SECRET_KEY` with the `sk_live_` key. Redeploy.
4. In Paystack's live-mode settings, re-enter the webhook URL (test and live mode have separate
   webhook configurations).
5. Make one real payment for a small, real test application to confirm the full path end to end,
   then check the Payments and Applications sheets to see it recorded correctly.

## 9. Security checklist

- [x] `PAYSTACK_SECRET_KEY` exists only in Vercel environment variables — never in frontend code,
      never in a `VITE_` variable, never committed.
- [x] The browser never determines the amount charged; the server reads it from `shared/fees.ts`.
- [x] A payment is recorded as successful only when the reference, the linked Application ID
      (via Paystack metadata), the currency, *and* the amount all match what the server expects.
      A mismatch is stored as `Processing` with a `REVIEW:` note for staff, never as `Success`.
- [x] The webhook signature is checked against the raw request body before anything is read from
      it, using a constant-time comparison.
- [x] Repeated webhooks, or a webhook arriving alongside a callback verification, update the Sheet
      at most once and send at most one confirmation email (`recordPaymentResult_`'s idempotency
      check in `apps-script/Code.gs`).
- [x] A successful payment can never be silently downgraded by a later, stale status.
- [x] Every payment attempt gets its own Paystack reference (`<Application ID>-P<random>`), so
      retries never collide and every attempt is individually traceable in the Payments sheet.
- [x] `/api/paystack/initialize` and `/api/paystack/verify` reject cross-origin requests and are
      rate-limited per IP.
- [x] `/api/paystack/reconcile` requires its own bearer secret, separate from the Sheets secret.
- [x] Only `https://checkout.paystack.com` (or an explicit local-dev origin) is ever used as a
      redirect target, so a compromised or buggy response can't send an applicant somewhere else.
- [x] No card details, secrets, or personal information ever appear in server logs — see
      `server/log.ts`.
