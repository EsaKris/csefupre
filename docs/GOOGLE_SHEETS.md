# Google Sheets data layer

Applications and enquiries are stored in a Google Sheet owned by the Centre. A Google Apps Script
attached to that Sheet receives records from the website's server.

```
Applicant's browser ──▶ Vercel function (/api/applications) ──▶ Apps Script Web App ──▶ Google Sheet
                         validates everything,                    checks shared secret,
                         holds all secrets                        locks, assigns ID, writes row
```

The browser never contacts Google directly, and no Google credentials exist in the website code.

---

## 1. Create the Sheet

1. Sign in with the **Centre's institutional Google account** (not a personal account). Records belong to the Centre, and the script runs as this account.
2. Create a new Google Sheet named, for example, **CSE Admissions**.
3. Share it only with admissions staff who need access.

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete the placeholder code in `Code.gs` and paste in the full contents of [`apps-script/Code.gs`](../apps-script/Code.gs). Save.
3. Optional but recommended: **Project Settings → Show "appsscript.json" manifest file in editor**, then replace the manifest with [`apps-script/appsscript.json`](../apps-script/appsscript.json). This limits the script's permissions to the Sheet it is attached to.

## 3. Set the shared secret

1. Generate a random secret (at least 32 characters). On any computer with Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. In Apps Script: **Project Settings → Script properties → Add script property**
   - Property: `SHARED_SECRET`
   - Value: the secret you generated
3. Keep this value — the same secret goes into Vercel as `GOOGLE_SHEETS_SECRET`.

The script **rejects every request** if `SHARED_SECRET` is missing or shorter than 32 characters.

## 4. Create the sheets

1. In the Apps Script editor, choose the function **`setupSheets`** from the toolbar dropdown and click **Run**.
2. Approve the authorisation prompt (it asks for access to this spreadsheet only).
3. Back in the Sheet you will now have three tabs — **Applications**, **Payments** and **Enquiries** — with headers, frozen header rows and status dropdowns.

Running `setupSheets` again is safe; it adds any missing headers without touching data.

## 5. Deploy as a Web App

1. **Deploy → New deployment → Select type: Web app**
2. Description: `CSE website data layer`
3. **Execute as: Me** (the Centre account)
4. **Who has access: Anyone**
5. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

> **Why "Anyone"?** The website's server cannot sign in to Google. The endpoint is protected by the
> shared secret instead, and the script exposes only four narrow actions (create application,
> create enquiry, look up one application by ID **and** matching email, and a health check).
> There is no action that lists or exports records.

## 6. Connect Vercel

In the Vercel project: **Settings → Environment Variables** (Production, and Preview if you test there):

| Variable | Value |
|---|---|
| `GOOGLE_SHEETS_ENDPOINT` | The Web app URL from step 5 |
| `GOOGLE_SHEETS_SECRET` | The same secret as `SHARED_SECRET` |
| `APP_SIGNING_SECRET` | A **different** random secret (same generation command) |

Redeploy the site after adding variables.

## 7. Updating the script later

Paste the new `Code.gs`, save, then **Deploy → Manage deployments → ✎ Edit → Version: New version → Deploy**.
Editing the existing deployment keeps the same URL, so Vercel needs no change.

## 8. Set up the hourly abandoned-payment check

Application submissions and enquiries work as soon as steps 1–7 are done. Payments need one more
step — the hourly check that catches applicants who start paying and never come back. This is
covered in **`docs/PAYSTACK.md` §5**, since it needs a Vercel environment variable
(`RECONCILE_SECRET`) alongside the Script properties. Come back here once that's done.

## 9. Verify everything is ready

Run this any time — right after setup, or later if something seems off.

1. In the Apps Script editor, choose **`verifySetup`** from the function dropdown and click **Run**.
2. Open **Executions** (left sidebar) or **View → Logs** and read the output. It checks:
   - `SHARED_SECRET` is set and long enough
   - all three sheets exist with every expected column header
   - `RECONCILE_URL` and `RECONCILE_SECRET` are set (§8)
   - the hourly payment-check trigger is installed exactly once
3. Fix anything marked ❌, run it again, and don't consider the Sheet ready until every line is ✅.

`verifySetup` never prints secret values — only whether each one is set and how many
characters long, so it's safe to read over someone's shoulder or paste into a support request.

## Rotating the secret

1. Generate a new secret.
2. Update `GOOGLE_SHEETS_SECRET` in Vercel and redeploy the site.
3. Immediately update `SHARED_SECRET` in Script properties.

Submissions that arrive between steps 2 and 3 fail with a friendly message; applicants' answers remain in their browser tab so they can retry.

---

## Applications sheet

The script finds columns **by header name**. Staff may add their own columns or reorder columns,
but must **not rename or delete** the headers below.

| Col | Header | Notes |
|---|---|---|
| A | Application ID | System. Format CSE-YYYY-NNNNNN. Never edit. |
| B | Submitted At | System. Date and time (Africa/Lagos). |
| C | First Name | From the application form. |
| D | Last Name | From the application form. |
| E | Email | From the application form. |
| F | Phone | From the application form. |
| G | Date of Birth | From the application form. |
| H | Gender | From the application form. |
| I | Country | From the application form. |
| J | State | From the application form. |
| K | Address | From the application form. |
| L | Programme | Readable programme name. |
| M | Programme Code | System. Used for fee lookup (professional-diploma, pgd, masters, phd). Never edit. |
| N | Highest Qualification | From the application form. |
| O | Institution | From the application form. |
| P | Course of Study | From the application form. |
| Q | Graduation Year | From the application form. |
| R | Grade / Classification | Added to the recommended structure — the form collects it. |
| S | Employment Status | From the application form. |
| T | Organization | From the application form. |
| U | Job Title | From the application form. |
| V | Years of Experience | From the application form. |
| W | Application Reason | From the application form. |
| X | Referral Source | From the application form. |
| Y | Contact Preference | From the application form. |
| Z | Application Status | Starts as Submitted. Staff update: Under Review, Completed, Withdrawn. |
| AA | Payment Status | Starts as Not Started. Updated automatically by payment verification (Phase 5). |
| AB | Payment Reference | Latest Paystack reference (Phase 5). Every attempt is also listed in the Payments sheet. |
| AC | Paystack Transaction ID | Set on verified payment (Phase 5). |
| AD | Payment Amount | Amount charged, set by the server from shared/fees.ts (Phase 5). |
| AE | Payment Date | Set on verified successful payment (Phase 5). |
| AF | Follow-up Status | Starts as Not Contacted. Set to Pending automatically for abandoned payments (Phase 5). Staff update the rest. |
| AG | Last Contacted | Staff. |
| AH | Notes | Staff. |
| AI | Updated At | System. |
| AJ | Submission ID | System. Prevents duplicate records when a submit is retried. Never edit. |

Two changes from the original recommended structure: **Programme Code** (after Programme) and
**Grade / Classification** (after Graduation Year) were added, and **Submission ID** is kept last.

### Status values

| Column | Values |
|---|---|
| Application Status | Submitted, Under Review, Completed, Withdrawn |
| Payment Status | Not Started, Pending, Ongoing, Processing, Queued, Success, Failed, Abandoned, Reversed |
| Follow-up Status | Not Contacted, Pending, Contacted, Responded, Converted, Closed |

### Following up abandoned payments

Filter **Payment Status = Abandoned** (or Failed) and **Follow-up Status = Pending**. After contacting
the applicant, set Follow-up Status, fill **Last Contacted**, and add **Notes**. Applicants continue
payment themselves at `/payment` using their Application ID and email.

## Payments sheet

One row per payment attempt (filled from Phase 5). The Applications row always shows the latest attempt.

| Col | Header |
|---|---|
| A | Payment Reference |
| B | Application ID |
| C | Initialized At |
| D | Amount |
| E | Currency |
| F | Status |
| G | Paystack Transaction ID |
| H | Channel |
| I | Paid At |
| J | Verified At |
| K | Last Event |
| L | Updated At |

## Enquiries sheet

| Col | Header |
|---|---|
| A | Enquiry ID |
| B | Received At |
| C | Full Name |
| D | Email |
| E | Phone |
| F | Enquiry Type |
| G | Course |
| H | Message |
| I | Status |
| J | Notes |
| K | Updated At |

Enquiry Status values: New, Responded, Closed.

---

## How records are protected

- **Shared secret** on every request, compared in constant time.
- **Script lock** around every write, so simultaneous submissions cannot receive the same ID.
- **IDs never reused:** the yearly counter lives in Script properties. If that property is lost, it is rebuilt from the highest ID in the sheet.
- **Duplicate protection:** the same browser submission retried returns the original record; a new submission using an email or phone from the last 180 days is refused (the website then emails the Application ID to the address on the existing record).
- **Formula injection blocked:** every applicant-supplied value is written as literal text, so input such as `=HYPERLINK(...)` is displayed, never executed, and phone numbers keep their leading zero.
- **Length and type checks** in the script as a second layer behind the website's validation.
- **No personal data in logs:** errors record the action name only.

## Limits

Apps Script is suitable for an admissions website's volume, but it has execution quotas and a cap
on simultaneous executions. Writes are serialised by the lock, so heavy bursts queue briefly and
then return a friendly "try again" message. If application volume grows substantially, the
`SheetsClient` interface in `server/sheets.ts` allows replacing Sheets with a database without
changing the website.

## Testing without Google

`npm run dev:api` runs this same `Code.gs` against an in-memory spreadsheet. `npm test` includes
unit tests for the script (`tests/apps-script.test.ts`).
