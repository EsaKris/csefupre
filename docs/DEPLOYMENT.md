# Deployment guide

Everything needed to take this project from a local checkout to a live site at the Centre's own
domain: Vercel setup, every environment variable, connecting the WhoGoHost domain, and the
checklist to run through before announcing the site is open for applications.

Read this alongside `docs/GOOGLE_SHEETS.md` (data layer) and `docs/PAYSTACK.md` (payments) —
this guide assumes both are already done, or does them in the right order below.

---

## 1. Order of operations

Do these in order — each later step depends on the one before it:

1. **Google Sheets** (`docs/GOOGLE_SHEETS.md`, steps 1–7) — create the Sheet, deploy the Apps
   Script, get the Web App URL and shared secret.
2. **Deploy to Vercel** (§2–4 below) — get the site live at a `*.vercel.app` URL first, before
   touching DNS. This gives you a working URL to test against immediately.
3. **Paystack** (`docs/PAYSTACK.md`) — create the account, add the secret key, point the webhook
   at the live Vercel URL.
4. **Hourly payment check** (`docs/GOOGLE_SHEETS.md` §8, `docs/PAYSTACK.md` §5) — needs the live
   URL from step 2, so it comes after deployment.
5. **Run `verifySetup`** in Apps Script (`docs/GOOGLE_SHEETS.md` §9) — confirms 1–4 are correct.
6. **Connect the WhoGoHost domain** (§5 below).
7. **Generate SEO prerendering** (§6 below) — needs the real domain from step 6.
8. **Go-live checklist** (§7 below).

## 2. Create the Vercel project

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. At [vercel.com](https://vercel.com), **Add New → Project**, import the repository.
3. Framework Preset: Vercel detects **Vite** automatically. Leave the build command as
   `npm run build` and the output directory as `dist` (both are already correct in
   `package.json` / this project's defaults).
4. Don't deploy yet — add the environment variables first (§3), then deploy.

## 3. Environment variables

**Project → Settings → Environment Variables.** Add every row below for **Production**, and
again for **Preview** if you'll test from preview deployments (pull requests). Use `sk_test_`
Paystack keys until go-live (§7).

| Variable | Where it comes from | Notes |
|---|---|---|
| `VITE_SITE_URL` | The domain you'll use, e.g. `https://cse.fupre.edu.ng` | No trailing slash. Frontend-safe (bundled into the browser) — it's just the canonical URL, not a secret. |
| `GOOGLE_SHEETS_ENDPOINT` | Apps Script Web App URL | `docs/GOOGLE_SHEETS.md` §5 |
| `GOOGLE_SHEETS_SECRET` | Same value as `SHARED_SECRET` in Apps Script | `docs/GOOGLE_SHEETS.md` §3 |
| `APP_SIGNING_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | A **different** random value from `GOOGLE_SHEETS_SECRET` — signs short-lived payment resume tokens. |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard → Settings → API Keys | Starts `sk_test_` (or `sk_live_` at go-live). |
| `RECONCILE_SECRET` | Generate the same way as `APP_SIGNING_SECRET` | A **third**, separate random value. Also goes into Apps Script Script Properties. |
| `EMAIL_PROVIDER_API_KEY` | Resend dashboard (optional) | Leave blank to launch without automated emails — everything else still works. |
| `EMAIL_FROM` | e.g. `"FUPRE CSE Admissions <admissions@your-domain>"` | Must be a verified sender in Resend once `EMAIL_PROVIDER_API_KEY` is set. |
| `ADMISSIONS_NOTIFY_EMAIL` | A staff email address (optional) | Gets notified of new enquiries, if set. |

`PAYSTACK_PUBLIC_KEY` from `.env.example` is not required — this integration uses Paystack's
redirect checkout, initialized entirely server-side, so the public key never needs to reach the
browser. Leave it unset.

After adding variables, **Deploy**. Vercel gives you a `https://<project>.vercel.app` URL —
use that for the rest of this guide until DNS (§5) is connected.

## 4. Confirm the deployment works

Visit the `.vercel.app` URL and check:

- The homepage and a few inner pages load with no console errors.
- `view-source:` on `/programmes/masters` shows a real `<title>` and meta tags if you've already
  run the SEO extraction (§6) — otherwise this is expected to be generic until then.
- `/apply` loads the application wizard; submitting a test application should produce a real
  Application ID (confirms Google Sheets is wired correctly).
- `/payment` after that submission should show the fee and a working "Proceed to Payment"
  button (confirms Paystack is wired correctly) — use a
  [Paystack test card](https://paystack.com/docs/payments/test-payments/) to complete it.
- Check the Google Sheet: a new row should appear in **Applications**, and after test payment,
  **Payments** too, with `Payment Status = Success`.

If any of this doesn't work, see **Troubleshooting** (§8) before continuing.

## 5. Connect the WhoGoHost domain

The domain is registered at WhoGoHost; the site is hosted on Vercel. This connects the two.

1. In Vercel: **Project → Settings → Domains → Add**. Enter the domain (e.g. `cse.fupre.edu.ng`
   for a subdomain, or the bare domain for the whole thing).
2. Vercel shows the DNS records it needs. Typically:
   - **Subdomain** (e.g. `cse.fupre.edu.ng`): a **CNAME** record pointing to `cname.vercel-dns.com`
   - **Root/apex domain** (e.g. `fupre.edu.ng` itself): an **A** record pointing to Vercel's
     apex IP, which Vercel displays on this screen (it can change — always use the value Vercel
     shows you, not a value copied from elsewhere)
3. Log in to **WhoGoHost → Domains → DNS Management** (or **cPanel → Zone Editor** if the
   domain's DNS is managed through cPanel rather than the WhoGoHost client area — check which
   applies to this account).
4. Add the record(s) from step 2 exactly as Vercel specifies. If FUPRE's IT department manages
   the parent `fupre.edu.ng` zone rather than WhoGoHost directly, these records need to go
   through them instead — confirm which is the case before assuming WhoGoHost access is enough.
5. DNS changes can take anywhere from a few minutes to 24–48 hours to propagate. Vercel's
   Domains screen shows a ✅ once it detects the record and issues an SSL certificate
   automatically (via Let's Encrypt) — no separate certificate purchase or upload is needed.
6. **www vs. non-www / canonical behaviour:** decide which is canonical (e.g. `cse.fupre.edu.ng`
   with no `www`) and add the other as a redirect in Vercel's Domains screen ("Redirect to
   Primary Domain"). Set `VITE_SITE_URL` (§3) to the canonical form and redeploy.
7. Once the domain is live, update `VITE_SITE_URL` in Vercel to the final domain (if it differs
   from what was set in §3) and redeploy.

## 6. Generate real SEO prerendering for the live domain

The sitemap and per-page social/search metadata need to point at the real domain, not a
placeholder. Do this once DNS is live (§5):

```bash
# with VITE_SITE_URL set to the real domain in .env.local, or exported in your shell
npm run build
npx vite preview --port 4190 &
npm run extract-seo -- http://localhost:4190
```

This writes `public/seo/*.json`. **Commit these files** and push — the next Vercel deploy will
pick them up automatically (`npm run build` stitches them into static HTML; see
`scripts/inject-seo.ts`). Re-run this whenever page titles, descriptions, or content that
affects meta tags changes.

Verify it worked: `curl -s https://<your-domain>/programmes/masters | grep '<title>'` should
show the real programme title, not a generic one.

## 7. Go-live checklist

Work through this before telling anyone the site is open for real applications.

**Content**
- [ ] Search the codebase for `<Tbd>` and fill in or confirm every placeholder is acceptable to
      launch with (some, like the refund policy, may reasonably launch as "contact admissions").
- [ ] Search `src/config/images.ts` for `src: ''` — every remaining empty slot ships a visible
      "photograph to be supplied" placeholder. Confirm this is intentional for launch.
- [ ] `src/pages/PrivacyPolicy.tsx` and `Terms.tsx` — the "Draft for institutional review" notice
      must be removed only after the University's own review/approval, not before.
- [ ] Confirm `site.admissions.applicationsOpen` and any deadline in `src/config/site.ts` match
      the real admission cycle.

**Fees**
- [ ] `shared/fees.ts` — confirm every amount is real and approved (application fees already are;
      course fees are still samples as of this handover — see the file's own comments).
- [ ] Set `FEES_ARE_PLACEHOLDERS = false` only once **every** amount in the file is confirmed —
      while `true`, the server refuses to charge a live Paystack key at all, which is the
      intended safety net.

**Payments**
- [ ] Switch `PAYSTACK_SECRET_KEY` to a `sk_live_` key (`docs/PAYSTACK.md` §8).
- [ ] Re-enter the webhook URL in Paystack's **live**-mode settings (test and live mode have
      separate webhook configs).
- [ ] Make one real payment for a genuine test application and confirm it appears correctly in
      both Paystack's dashboard and the Google Sheet.

**Infrastructure**
- [ ] Run `docs/GOOGLE_SHEETS.md` §9's `verifySetup()` — every line should read ✅.
- [ ] Confirm the WhoGoHost domain resolves to the site over HTTPS with a valid certificate.
- [ ] Run the security verification commands in `docs/SECURITY.md` against the live domain.
- [ ] Confirm `npm test` and the full e2e suite (`README.md` → Local development) pass on the
      exact commit being deployed.

**SEO**
- [ ] `public/seo/*.json` was generated against the real domain (§6) and committed.
- [ ] `curl https://<domain>/sitemap.xml` returns real URLs, not placeholder ones.
- [ ] Submit the sitemap URL in Google Search Console once live.

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Applying shows "could not submit your application" | `GOOGLE_SHEETS_ENDPOINT`/`GOOGLE_SHEETS_SECRET` missing or mismatched with Apps Script's `SHARED_SECRET`. Run `verifySetup` in Apps Script. |
| "Proceed to Payment" fails immediately | `PAYSTACK_SECRET_KEY` missing/invalid, or sample fees are still active with a live key (`FEES_ARE_PLACEHOLDERS`) — see the checklist above. |
| Payment succeeds on Paystack but the Sheet never updates | Webhook URL not set, or set in the wrong mode (test vs. live) in Paystack. The hourly reconcile job (§1 step 4) will still catch it within an hour as a fallback. |
| Site loads but social media (WhatsApp/Facebook) link previews show generic text | `public/seo/*.json` wasn't generated (§6), or was generated before `VITE_SITE_URL` was set to the real domain — regenerate and redeploy. |
| Build fails on Vercel with a module resolution error under `server/` or `api/` | A relative import is missing its `.js` extension — required for Node ESM. See README → Server API. |
| Domain shows a certificate error | DNS hasn't finished propagating, or the wrong record type was used (CNAME vs A) — recheck against what Vercel's Domains screen currently shows. |
