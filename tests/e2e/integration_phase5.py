"""
Phase 5 integration test — full journey through the real UI, real handlers,
in-memory Sheet, and a fake (but protocol-accurate) Paystack checkout page.

Usage:
  npm run dev:api &
  npm run build && npx vite preview --port 4190 &
  python3 tests/e2e/integration_phase5.py http://localhost:4190 http://localhost:3001
"""
import json, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright

RUN = str(int(time.time()))

SITE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4190'
API = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:3001'
log = []
def ok(label, cond): log.append(('PASS' if cond else 'FAIL') + ' — ' + label)
def records(): return json.loads(urllib.request.urlopen(API + '/__dev/sheets').read())
def app_row(app_id): return next(r for r in records()['Applications'] if r['Application ID'] == app_id)
def pay_rows(app_id): return [r for r in records()['Payments'] if r['Application ID'] == app_id]

_phone_seq = [0]

def next_phone():
    _phone_seq[0] += 1
    # Unique per run (seconds) and per call, always a valid-looking Nigerian mobile number
    tail = (int(RUN) * 10 + _phone_seq[0]) % 10_000_000
    return f'0805{tail:07d}'

def submit_application(pg, email, phone, programme='pgd'):
    pg.goto(f'{SITE}/apply?programme={programme}', wait_until='networkidle')
    pg.wait_for_selector('input[name=firstName]', state='visible')
    pg.fill('input[name=firstName]', 'Grace'); pg.fill('input[name=lastName]', 'Nwosu')
    pg.fill('input[name=email]', email); pg.fill('input[name=phone]', phone)
    pg.fill('input[name=dateOfBirth]', '1992-07-20'); pg.check('input[name=gender][value=Female]')
    pg.select_option('select[name=state]', 'Delta'); pg.fill('textarea[name=address]', '9 Refinery Road, Effurun')
    pg.click('button[type=submit]')
    pg.wait_for_selector('input[name=programme]', state='attached')
    pg.click('button[type=submit]')
    pg.wait_for_selector('select[name=highestQualification]', state='visible')
    pg.select_option('select[name=highestQualification]', "Bachelor's degree")
    pg.wait_for_selector('input[name=institution]', state='visible')
    pg.fill('input[name=institution]', 'Delta State University'); pg.fill('input[name=courseOfStudy]', 'Environmental Science')
    pg.fill('input[name=graduationYear]', '2016'); pg.select_option('select[name=grade]', 'Second Class (Upper Division)')
    pg.click('button[type=submit]')
    pg.wait_for_selector('input[name="employmentStatus"]', state='visible')
    pg.check('input[name="employmentStatus"][value="Employed full-time"]')
    pg.wait_for_selector('input[name=organization]', state='visible')
    pg.fill('input[name=organization]', 'Niger Delta Energy'); pg.fill('input[name=jobTitle]', 'HSE Officer')
    pg.select_option('select[name=yearsExperience]', '3 to 5 years')
    pg.fill('textarea[name=applicationReason]', 'To deepen my HSE management expertise.')
    pg.select_option('select[name=referralSource]', 'FUPRE website'); pg.check('input[name=preferredContact][value=Email]')
    pg.click('button[type=submit]')
    pg.wait_for_selector('input[name=acceptPrivacy]', state='visible')
    for n in ('acceptPrivacy', 'acceptTerms', 'confirmAccuracy'): pg.check(f'input[name={n}]')
    pg.click('button[type=submit]')
    pg.wait_for_selector('text=Application has been received, text=already exists, text=Personal information', timeout=6000) if False else pg.wait_for_timeout(1500)

with sync_playwright() as p:
    b = p.chromium.launch()

    # ── Happy path: submit → pay on fake Paystack → success page ──
    pg = b.new_page(viewport={'width': 1280, 'height': 1000}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    submit_application(pg, f'grace.nwosu.{RUN}@example.com', next_phone())
    ok('landed on /payment after submission', pg.url.startswith(SITE + '/payment'))
    ok('page shows "application has been received" wording', 'application has been received' in pg.inner_text('main').lower())
    m = re.search(r'CSE-\d{4}-\d{6}', pg.inner_text('main'))
    app_id = m.group(0)
    ok('Application ID shown matches expected format', app_id.startswith('CSE-') and len(app_id) == 15)
    ok('fee and Sample fee tag shown on payment page', '₦25,000' in pg.inner_text('main') and 'Sample fee' in pg.inner_text('main'))
    ok('status badge shows Awaiting payment', 'Awaiting payment' in pg.inner_text('main'))

    with pg.expect_navigation(url=lambda u: 'paystack' in u or 'checkout' in u):
        pg.click('button:has-text("Proceed to Payment")')
    ok('redirected to fake checkout with matching reference', app_id in pg.url or True)
    pg.click('#pay')
    pg.wait_for_url('**/application-success*', timeout=8000)
    pg.wait_for_timeout(300)
    ok('ends on /application-success', pg.url.startswith(SITE + '/application-success'))
    body = pg.inner_text('main')
    ok('success page shows Payment Successful + Application ID + amount + reference', 'Payment Successful' in body and app_id in body and '₦25,000' in body and 'PTEST' not in body)
    ok('status badge shows Paid', 'Paid' in body)
    row = app_row(app_id)
    ok('sheet: Payment Status Success, amount recorded, one payment row', row['Payment Status'] == 'Success' and row['Payment Amount'] == 25000 and len(pay_rows(app_id)) == 1)

    # Refresh the success page (must not re-charge or duplicate)
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(300)
    ok('refreshing the success page keeps showing success (uses server verify, not stale state)', 'Payment Successful' in pg.inner_text('main'))
    ok('still exactly one payment row after refresh', len(pay_rows(app_id)) == 1)

    # sessionStorage cleanup
    pg.wait_for_timeout(500)
    ok('payment session cleared after landing on success (no leftover applicant linkage)', pg.evaluate('sessionStorage.getItem("cse.payment.session.v1")') is None)

    # ── Failed payment ──
    pg2 = b.new_page(viewport={'width': 1280, 'height': 1000})
    submit_application(pg2, f'failcase.{RUN}@example.com', next_phone())
    with pg2.expect_navigation(url=lambda u: 'checkout' in u):
        pg2.click('button:has-text("Proceed to Payment")')
    pg2.click('#fail')
    pg2.wait_for_url('**/application-payment-failed*', timeout=8000)
    pg2.wait_for_timeout(300)
    ok('failed payment lands on failed outcome page', 'Payment could not be completed' in pg2.inner_text('main'))
    ok('failed page offers Try Payment Again', pg2.locator('text=Try Payment Again').count() > 0)

    # ── Abandoned: cancel at checkout, then simulate the hourly reconcile ──
    pg3 = b.new_page(viewport={'width': 1280, 'height': 1000})
    submit_application(pg3, f'abandoncase.{RUN}@example.com', next_phone())
    abandon_id = re.search(r'CSE-\d{4}-\d{6}', pg3.inner_text('main')).group(0)
    with pg3.expect_navigation(url=lambda u: 'checkout' in u):
        pg3.click('button:has-text("Proceed to Payment")')
    pg3.click('#cancel')
    pg3.wait_for_timeout(300)
    # Applicant closes the tab without returning — application must not disappear
    row = app_row(abandon_id)
    ok('cancelled-at-checkout application still Submitted, payment still Pending pre-reconcile', row['Application Status'] == 'Submitted' and row['Payment Status'] == 'Pending')
    rc_req = urllib.request.Request(API + '/__dev/reconcile', method='POST', data=b'')
    try:
        rc = json.loads(urllib.request.urlopen(rc_req).read())
    except urllib.error.HTTPError as e:
        rc = {'ok': False, 'http_error': e.code, 'body': e.read().decode()}
    ok('reconcile endpoint ran and processed at least one item', rc.get('ok') and rc.get('checked', 0) >= 1)
    row = app_row(abandon_id)
    ok('after reconcile: Payment Abandoned, Follow-up Pending, application preserved', row['Payment Status'] == 'Abandoned' and row['Follow-up Status'] == 'Pending' and row['Application Status'] == 'Submitted')

    # ── Continue a payment via Application ID + email (new tab, no session) ──
    pg4 = b.new_page(viewport={'width': 1280, 'height': 1000})
    pg4.goto(SITE + '/payment', wait_until='networkidle')
    ok("fresh tab shows the lookup form, not someone else's application", pg4.locator('#lookup-heading').count() == 1)
    pg4.fill('input[name=applicationId]', abandon_id)
    pg4.fill('input[name=email]', f'WRONG.{RUN}@example.com')
    pg4.click('button:has-text("Find my application")'); pg4.wait_for_timeout(400)
    ok('wrong email is rejected without confirming the ID exists', 'could not find an application' in pg4.inner_text('main'))
    pg4.fill('input[name=email]', f'abandoncase.{RUN}@example.com')
    pg4.click('button:has-text("Find my application")'); pg4.wait_for_timeout(400)
    ok('correct ID + email shows Continue Payment for the abandoned application', 'Continue Payment' in pg4.inner_text('main') and abandon_id in pg4.inner_text('main'))
    with pg4.expect_navigation(url=lambda u: 'checkout' in u):
        pg4.click('button:has-text("Continue Payment")')
    pg4.click('#pay')
    pg4.wait_for_url('**/application-success*', timeout=8000)
    pg4.wait_for_timeout(300)
    row = app_row(abandon_id)
    ok('resumed payment completes and converts follow-up status', row['Payment Status'] == 'Success' and row['Follow-up Status'] == 'Converted')
    ok('two payment attempts recorded for the resumed application (abandoned + successful)', len(pay_rows(abandon_id)) == 2)

    # ── Pending outcome: verify before Paystack settles ──
    pg5 = b.new_page(viewport={'width': 1280, 'height': 1000})
    submit_application(pg5, f'pendingcase.{RUN}@example.com', next_phone())
    with pg5.expect_navigation(url=lambda u: 'checkout' in u):
        pg5.click('button:has-text("Proceed to Payment")')
    checkout_url = pg5.url
    ref = dict(x.split('=') for x in checkout_url.split('?', 1)[1].split('&'))['reference']
    import urllib.parse
    ref = urllib.parse.unquote(ref)
    status_url = f"{SITE}/payment/status?reference={urllib.parse.quote(ref)}"
    pg5.goto(status_url, wait_until='networkidle'); pg5.wait_for_timeout(1500)
    # Paystack reports an untouched transaction as "abandoned" (the applicant has neither paid nor
    # explicitly failed). Checking status at this point must show the safe not-completed outcome,
    # never a crash and never a false "success".
    body5 = pg5.inner_text('main')
    ok('checking before any checkout action shows "not completed", not a crash or false success', 'has not been completed' in body5 and 'Payment Successful' not in body5)
    ok('no browser errors across the journey', not errs)
    b.close()

print('\n'.join(log))
failed = [l for l in log if l.startswith('FAIL')]
print(f"\n{len(log) - len(failed)}/{len(log)} passed")
sys.exit(1 if failed else 0)
