"""
End-to-end test for the application wizard (Phase 3).
The /api/applications endpoint is mocked so the UI can be tested before Phase 4.

Usage:
  npm run build && npx vite preview --port 4180
  python3 tests/e2e/apply_wizard.py [base_url] [screenshot_dir]
Requires: pip install playwright && playwright install chromium
"""
import json, sys
from playwright.sync_api import sync_playwright

U = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4180'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else None
log = []
def ok(label, cond): log.append(('PASS' if cond else 'FAIL') + ' — ' + label)
def shot(pg, name):
    if SHOTS: pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    mode = {'v': 'created'}; captured = {}
    def handle(route):
        captured['body'] = json.loads(route.request.post_data)
        if mode['v'] == 'created':
            route.fulfill(status=201, content_type='application/json', body=json.dumps({'ok': True, 'data': {'status': 'created', 'applicationId': 'CSE-2026-000001', 'resumeToken': 'tok'}}))
        elif mode['v'] == 'duplicate':
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': True, 'data': {'status': 'duplicate', 'reminderSent': True}}))
        else:
            route.fulfill(status=500, body='boom')
    pg.route('**/api/applications', handle)
    # This suite tests the wizard in isolation. Once it hands off to /payment, that page
    # immediately asks the server to validate the resume token — mock that too, so an
    # unrelated (correctly working) security check doesn't affect these assertions.
    pg.route('**/api/payments/summary', lambda route: route.fulfill(
        status=200, content_type='application/json',
        body=json.dumps({'ok': True, 'data': {'status': 'found', 'resumeToken': 'tok', 'application': {
            'applicationId': 'CSE-2026-000001', 'applicantName': 'Ada Okafor', 'programme': 'masters',
            'programmeName': "Master's Degree in Health, Environment, Safety and Security", 'fee': 35000, 'paymentStatus': 'Not Started',
        }}}),
    ))

    pg.goto(U + '/apply?programme=masters', wait_until='networkidle')
    ok('Step 1 of 6 shown', 'Step 1 of 6' in pg.inner_text('nav[aria-label="Application progress"]'))
    pg.click('button[type=submit]'); pg.wait_for_timeout(150)
    ok('empty step 1 shows error summary', 'problems to fix' in pg.inner_text('[role=alert]'))
    ok('error summary focused', pg.evaluate('document.activeElement.getAttribute("role")') == 'alert')
    shot(pg, 'apply-1-errors')
    pg.fill('input[name=firstName]', 'Ada'); pg.fill('input[name=lastName]', 'Okafor')
    pg.fill('input[name=email]', 'ada@example.com'); pg.fill('input[name=phone]', '0802 848 7246')
    pg.fill('input[name=dateOfBirth]', '1994-05-12'); pg.check('input[name=gender][value=Female]')
    pg.select_option('select[name=state]', 'Delta'); pg.fill('textarea[name=address]', '12 Refinery Road, Effurun')
    pg.click('button[type=submit]'); pg.wait_for_timeout(200)
    ok('advanced to step 2 (?step=2)', 'step=2' in pg.url)
    ok('programme preselected from ?programme=masters', pg.is_checked('input[name=programme][value=masters]'))
    ok('focus moved to step heading', pg.evaluate('document.activeElement.tagName') == 'H2')
    shot(pg, 'apply-2-programme')
    pg.go_back(); pg.wait_for_timeout(200)
    ok('browser Back returns to step 1 with values kept', pg.input_value('input[name=firstName]') == 'Ada')
    pg.go_forward(); pg.wait_for_timeout(200)
    pg.click('button[type=submit]'); pg.wait_for_timeout(200)

    pg.select_option('select[name=highestQualification]', "Bachelor's degree")
    pg.fill('input[name=institution]', 'University of Benin'); pg.fill('input[name=courseOfStudy]', 'Chemical Engineering')
    pg.fill('input[name=graduationYear]', '2017'); pg.select_option('select[name=grade]', 'Third Class'); pg.wait_for_timeout(100)
    ok("eligibility warning for Third Class → Master's", 'published entry requirement' in pg.inner_text('form'))
    shot(pg, 'apply-3-warning')
    pg.select_option('select[name=grade]', 'Second Class (Upper Division)'); pg.wait_for_timeout(100)
    ok('warning clears for 2:1', 'published entry requirement' not in pg.inner_text('form'))
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(200)
    ok('reload restores draft + welcome back banner', pg.input_value('input[name=institution]') == 'University of Benin' and 'Welcome back' in pg.inner_text('main'))
    pg.click('button[type=submit]'); pg.wait_for_timeout(200)

    ok('org/job hidden before employment chosen', pg.locator('input[name=organization]').count() == 0)
    pg.check('input[name="employmentStatus"][value="Employed full-time"]')
    pg.click('button[type=submit]'); pg.wait_for_timeout(150)
    txt = pg.inner_text('[role=alert]')
    ok('employed requires organisation & job title (reported with other errors)', 'Organisation' in txt and 'Job title' in txt and 'Years of experience' in txt)
    pg.fill('input[name=organization]', 'Example Energy Ltd'); pg.fill('input[name=jobTitle]', 'Safety Officer')
    pg.select_option('select[name=yearsExperience]', '3 to 5 years')
    pg.fill('textarea[name=applicationReason]', 'I want to move into HSE management leadership.')
    pg.select_option('select[name=referralSource]', 'Friend or colleague'); pg.check('input[name=preferredContact][value=WhatsApp]')
    shot(pg, 'apply-4-professional')
    pg.click('button[type=submit]'); pg.wait_for_timeout(200)

    body = pg.inner_text('form')
    ok('review shows entered data', 'Ada Okafor' in body and "Master's Degree in Health" in body and 'Example Energy Ltd' in body)
    ok('review shows the programme application fee with Sample tag', '₦35,000' in body and 'Sample fee' in body)
    shot(pg, 'apply-5-review')
    pg.click('button:has-text("Edit educational background")'); pg.wait_for_timeout(200)
    ok('Edit jumps to step 3 with "Save & return to review"', 'step=3' in pg.url and pg.inner_text('button[type=submit]') == 'Save & return to review')
    pg.click('button[type=submit]'); pg.wait_for_timeout(200)
    ok('returns straight to review', 'step=5' in pg.url)
    pg.click('button[type=submit]'); pg.wait_for_timeout(150)
    ok('consents required', 'Privacy Policy' in pg.inner_text('[role=alert]'))
    for n in ('acceptPrivacy', 'acceptTerms', 'confirmAccuracy'): pg.check(f'input[name={n}]')

    mode['v'] = 'error'; pg.click('button[type=submit]'); pg.wait_for_timeout(600)
    ok('server error shows friendly message, no technical detail', 'could not submit your application' in pg.inner_text('form') and 'boom' not in pg.inner_text('main'))
    mode['v'] = 'duplicate'; pg.click('button[type=submit]'); pg.wait_for_timeout(600)
    ok('duplicate shows existing-application message', 'already exists' in pg.inner_text('form') and 'has been sent' in pg.inner_text('form'))
    mode['v'] = 'created'; pg.click('button[type=submit]'); pg.wait_for_timeout(800)
    ok('created → navigates to /payment', pg.url.endswith('/payment'))
    ok('draft cleared after submit', pg.evaluate('sessionStorage.getItem("cse.application.draft.v1")') is None)
    ok('payment session stored (no personal data)', json.loads(pg.evaluate('sessionStorage.getItem("cse.payment.session.v1")')) == {'applicationId': 'CSE-2026-000001', 'resumeToken': 'tok'})
    bd = captured['body']
    ok('request includes submissionId and honeypot field', bool(bd.get('submissionId')) and bd.get('companyWebsite') == '' and bd['programme'] == 'masters')

    pg2 = ctx.new_page(); pg2.goto(U + '/apply?step=5', wait_until='networkidle')
    ok('cannot skip ahead via ?step=5 on a new application', 'Step 1 of 6' in pg2.inner_text('nav[aria-label="Application progress"]'))
    for w in (320, 375):
        m = b.new_page(viewport={'width': w, 'height': 800}); m.goto(U + '/apply', wait_until='networkidle')
        ok(f'no horizontal overflow at {w}px', m.evaluate('document.documentElement.scrollWidth') <= w)
        if w == 375: shot(m, 'apply-mobile-step1')
    ok('no page errors', not errs)
    b.close()

print('\n'.join(log))
failed = [l for l in log if l.startswith('FAIL')]
print(f"\n{len(log) - len(failed)}/{len(log)} passed")
sys.exit(1 if failed else 0)
