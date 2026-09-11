# Centre for Safety Education (CSE), FUPRE — Website

Institutional admissions and programme website for the Centre for Safety Education,
Federal University of Petroleum Resources, Effurun.

React + Vite + React Router, Tailwind CSS v4, deployed on Vercel. Payment and data
operations run in Vercel serverless functions (`/api`) — never in browser code.

---

## Build status

| Phase | Scope | Status |
|---|---|---|
| 1 | Scaffold, central config, design system, layout (top bar, navbar, footer), homepage | **Done** |
| 2 | About, Programmes (+4 programme pages), Admissions, Requirements (with eligibility guide), Courses, Careers, Contact (enquiry form UI), Privacy, Terms, FAQ, Brochure | **Done** |
| 3 | Multi-step application wizard, shared validation schema, per-item fee configuration, tests | **Done** |
| 4 | Google Apps Script data layer, Sheet structure, `/api/applications` and `/api/enquiries`, email module, local dev API | **Done** |
| 5 | Paystack initialize / verify / webhook / reconcile, payment pages, outcome pages | **Done** |
| 6 | Security headers + CSP, prerendering, sitemap/robots, structured data, full deployment docs | Next |

Routes not yet built render a clearly marked **"Page scheduled for Phase N"** notice
(`src/pages/PendingPage.tsx`) so navigation can be reviewed. That file is deleted before launch.

---

## Local development

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local   # fill values as they become available

npm run dev:api              # terminal 1 — local API on :3001 (in-memory Google Sheet, emails printed to terminal)
npm run dev                  # terminal 2 — site on http://localhost:5173 (proxies /api to :3001)

npm test                     # unit tests: validation, fees, Apps Script data layer, API handlers
npm run build                # type-check + production build
```

With both running, the full application and enquiry flow works locally without Google or Vercel.
Stored records are visible at http://localhost:3001/__dev/sheets.

Browser end-to-end tests (Python Playwright):

```bash
npm run build && npx vite preview --port 4190 &
python3 tests/e2e/apply_wizard.py http://localhost:4190          # wizard UI (API mocked)
python3 tests/e2e/integration_phase4.py http://localhost:4190     # applications + enquiries, full flow
python3 tests/e2e/integration_phase5.py http://localhost:4190     # full payment journey via the fake Paystack checkout
```

---

## Project structure

```
src/config/        Editable institutional content (single source of truth)
src/pages/         One file per route; programmes/ holds the four programme pages
src/components/    layout/, ui/, content/, programmes/, forms/, home/
src/lib/           SEO helper, API client, draft storage
shared/            Used by BOTH browser and server: validation schemas, catalog IDs, fees
api/               Vercel serverless function entry points (thin wrappers)
server/            Server-only code: handlers, Sheets client, tokens, email, rate limiting
apps-script/       Google Apps Script data layer (paste into the Sheet's script editor)
scripts/           Local dev API server and the Apps Script test harness
tests/             Unit tests (node:test) and browser e2e tests (tests/e2e)
docs/              Asset guide and, later, Sheets/Paystack/deployment docs
```

## The application form

`/apply` is a six-step wizard: Personal, Programme, Education, Professional, Review, then Payment.

- The step is kept in the URL (`?step=3`) so the browser Back button moves between steps; applicants cannot skip ahead of steps they have completed.
- Answers are saved to `sessionStorage` as the applicant types, restored after a reload, and cleared on submission or when the tab closes. Nothing is written to `localStorage`.
- Each step is validated with the shared zod schema before continuing. The server re-validates the full application with the same schema.
- A non-blocking notice appears when a stated qualification does not match the programme's published requirement.
- A random `submissionId` is sent with each application so the server can ignore accidental double submissions.
- A hidden honeypot field (`companyWebsite`) is sent for spam filtering.

## Where to edit content

All institutional content is centralised — do not edit text inside components.

| File | Contains |
|---|---|
| `src/config/site.ts` | Names, email, phone numbers, address, website, map embed, brochure path, admission deadline, social links, copyright |
| `src/config/programmes.ts` | The four programmes: titles, durations, summaries, admission requirements |
| `src/config/courses.ts` | Short courses, categories, general subject descriptions; official outlines (null until supplied) |
| `src/config/careers.ts` | Career paths and the employment disclaimer |
| `src/config/home.ts` | Homepage copy |
| `src/config/about.ts` | About page copy; vision, mission, objectives (null until supplied) |
| `src/config/faq.ts` | FAQ questions and answers |
| `src/config/navigation.ts` | Header, footer and legal links |
| `src/config/images.ts` | Every image and logo slot on the site |
| `src/styles/index.css` | Colour, type and spacing tokens |

### Fees

All fees live in **`shared/fees.ts`**: an application fee per programme, and an individual fee for every
short course. Amounts are whole Naira; `null` means not yet confirmed.

- The website reads this file to **display** fees ("to be confirmed" while `null`).
- The payment server (Phase 5) reads the same file to **charge** fees, and ignores any amount sent from a browser.
- **Current amounts are samples** (`FEES_ARE_PLACEHOLDERS = true`): each shows a "Sample fee" tag, and the server will not take payment with a live Paystack key. Replace the amounts, then set the flag to `false`.
- `npm test` checks that every course has a distinct price and that all fees are positive whole Naira.

---

## Supplying logos, photographs and documents

See `docs/ASSETS.md` for the full list of slots and recommended sizes. In short:

1. Place the file in `public/assets/logos`, `public/assets/images` or `public/assets/documents`.
2. Set `src` (and `width`/`height` for photographs) in `src/config/images.ts`, or `brochureUrl` in `site.ts`.
3. The placeholder frame is replaced automatically.

---

## Before launch: placeholder sweep

Placeholders are visible on purpose so nothing ships unnoticed. Before going live:

- Search for `<Tbd>` — content awaiting confirmation from the Centre.
- Search `src/config/images.ts` for `src: ''` — images and logos not yet supplied.
- Confirm `src/pages/PendingPage.tsx` is no longer imported, then delete it.
- Replace sample fees in `shared/fees.ts` and set `FEES_ARE_PLACEHOLDERS = false`.
- Confirm `site.admissions.applicationsOpen` reflects the actual admission cycle.
- Remove the "Draft for institutional review" notices on Privacy Policy and Terms once approved.

---

## Server API

| Endpoint | Purpose |
|---|---|
| `POST /api/applications` | Validates and stores an application; returns `{ status: 'created', applicationId, resumeToken }` or `{ status: 'duplicate', reminderSent }` |
| `POST /api/enquiries` | Validates and stores a contact-form enquiry |

Both endpoints: require `Content-Type: application/json`; reject cross-origin browser requests; limit body size;
apply best-effort per-IP rate limits; silently discard honeypot submissions; re-validate with the shared zod
schemas; return plain-language errors only; and fail closed (503) if server secrets are missing.

Server code in `api/`, `server/` and `shared/` uses explicit `.js` extensions on relative imports. This is
required for Node ES modules on Vercel — keep it when adding files.

Google Sheets setup, the exact column structure and staff follow-up workflow: **`docs/GOOGLE_SHEETS.md`**.

## Email

When `EMAIL_PROVIDER_API_KEY` and `EMAIL_FROM` are set, the server sends (via Resend):

- **Application received** — Application ID, programme, fee, and how to pay
- **Existing application reminder** — sent to the email on file when someone tries to apply again with the same email or phone
- **New enquiry notification** — to `ADMISSIONS_NOTIFY_EMAIL`, if set

Without them, submissions still work and emails are skipped. Payment emails are added in Phase 5.

## Payments

`/payment` shows the application summary and fee, and starts checkout. Applicants can also
return later using their Application ID + email ("Continue a payment") — this works from any
device, not just the one they applied from.

| Endpoint | Purpose |
|---|---|
| `POST /api/payments/summary` | Looks up an application by resume token or Application ID + email |
| `POST /api/paystack/initialize` | Starts a Paystack transaction for the server-side fee amount |
| `POST /api/paystack/verify` | Confirms a transaction with Paystack (used by the callback page) |
| `POST /api/paystack/webhook` | Receives Paystack's server-to-server payment notifications |
| `POST /api/paystack/reconcile` | Hourly check for payments the applicant never completed |

Outcome pages: `/application-success`, `/application-payment-pending`, `/application-payment-failed`
(also covers abandoned/reversed). Each re-verifies with the server on load — reaching the page
proves nothing by itself.

Full setup (Paystack account, webhook URL, the hourly abandoned-payment trigger, going live):
**`docs/PAYSTACK.md`**.

## Known dependencies on later phases

- Security headers, Content-Security-Policy, prerendering for social link previews, sitemap.xml, robots.txt and structured data (Phase 6).
- Full deployment guide: Vercel setup, WhoGoHost DNS, environment variable checklist, go-live steps (Phase 6).
