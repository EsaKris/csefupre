"""
Phase 4 integration test — no mocks between browser and data layer.
Browser → Vite preview proxy → scripts/dev-api.ts (real handlers) → apps-script/Code.gs (in-memory sheet)

Usage:
  npm run dev:api &                     # port 3001
  npm run build && npx vite preview --port 4190 &
  python3 tests/e2e/integration_phase4.py http://localhost:4190 http://localhost:3001
"""
import json, sys, urllib.request
from playwright.sync_api import sync_playwright

SITE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4190'
API = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:3001'
log = []
def ok(label, cond): log.append(('PASS' if cond else 'FAIL') + ' — ' + label)
def records(): return json.loads(urllib.request.urlopen(API + '/__dev/sheets').read())

def fill_application(pg, email, phone, submit=True):
    pg.goto(SITE + '/apply?programme=pgd', wait_until='networkidle')
    pg.fill('input[name=firstName]', 'Chidi'); pg.fill('input[name=lastName]', 'Eze')
    pg.fill('input[name=email]', email); pg.fill('input[name=phone]', phone)
    pg.fill('input[name=dateOfBirth]', '1990-03-04'); pg.check('input[name=gender][value=Male]')
    pg.select_option('select[name=state]', 'Rivers'); pg.fill('textarea[name=address]', '4 Aba Road, Port Harcourt')
    pg.click('button[type=submit]'); pg.wait_for_timeout(250)
    pg.click('button[type=submit]'); pg.wait_for_timeout(250)
    pg.select_option('select[name=highestQualification]', 'Higher National Diploma (HND)')
    pg.fill('input[name=institution]', 'Federal Polytechnic Nekede'); pg.fill('input[name=courseOfStudy]', 'Petroleum Engineering')
    pg.fill('input[name=graduationYear]', '2014'); pg.select_option('select[name=grade]', 'Upper Credit')
    pg.click('button[type=submit]'); pg.wait_for_timeout(250)
    pg.check('input[name="employmentStatus"][value="Self-employed"]')
    pg.fill('input[name=organization]', '=HYPERLINK("http://evil")'); pg.fill('input[name=jobTitle]', 'HSE Consultant')
    pg.select_option('select[name=yearsExperience]', '6 to 10 years')
    pg.fill('textarea[name=applicationReason]', 'To formalise my HSE consulting practice with a postgraduate qualification.')
    pg.select_option('select[name=referralSource]', 'ISPON'); pg.check('input[name=preferredContact][value=Email]')
    pg.click('button[type=submit]'); pg.wait_for_timeout(250)
    for n in ('acceptPrivacy', 'acceptTerms', 'confirmAccuracy'): pg.check(f'input[name={n}]')
    if submit:
        pg.click('button[type=submit]'); pg.wait_for_timeout(1500)

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    before = len(records()['Applications'])

    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    fill_application(pg, 'chidi.eze@example.com', '0803 111 2233')
    ok('successful submission navigates to /payment', pg.url.endswith('/payment'))
    session = json.loads(pg.evaluate('sessionStorage.getItem("cse.payment.session.v1")') or '{}')
    ok('Application ID has expected format', bool(session.get('applicationId', '').startswith('CSE-')) and len(session['applicationId']) == 15)
    ok('resume token issued', session.get('resumeToken', '').count('.') == 1)
    recs = records()['Applications']
    ok('exactly one new row in Applications sheet', len(recs) == before + 1)
    row = recs[-1]
    ok('row ID matches the ID given to the browser', row['Application ID'] == session.get('applicationId'))
    ok('server-normalised phone stored as text with leading zero', row['Phone'] == '08031112233')
    ok('programme stored as readable name + code', row['Programme'].startswith('Postgraduate Diploma') and row['Programme Code'] == 'pgd')
    ok('formula-like input stored as literal text', row['Organization'] == '=HYPERLINK("http://evil")')
    ok('initial statuses set', (row['Application Status'], row['Payment Status'], row['Follow-up Status']) == ('Submitted', 'Not Started', 'Not Contacted'))
    ok('consent flags / honeypot not stored as columns', 'acceptTerms' not in row and 'companyWebsite' not in row)

    # Duplicate by phone (+234 form), different email
    pg2 = b.new_page(viewport={'width': 1280, 'height': 900})
    fill_application(pg2, 'someone.else@example.com', '+234 803 111 2233')
    text = pg2.inner_text('form')
    ok('duplicate phone blocked with existing-application message', 'already exists' in text)
    ok('duplicate reveals neither the existing Application ID nor the original email', session['applicationId'] not in text and 'chidi.eze@example.com' not in text)
    ok('no second row written', len(records()['Applications']) == before + 1)

    # Enquiry form end to end
    e = b.new_page(viewport={'width': 1280, 'height': 900})
    e.goto(SITE + '/contact?topic=Short%20courses&course=confined-space-entry', wait_until='networkidle')
    e.fill('input[name=fullName]', 'Ngozi Adeyemi'); e.fill('input[name=email]', 'ngozi@example.com')
    e.fill('textarea[name=message]', 'Please share the schedule for Confined Space Entry.')
    e.click('button[type=submit]'); e.wait_for_timeout(1500)
    ok('enquiry shows "Enquiry sent"', 'Enquiry sent' in e.inner_text('main'))
    enq = records()['Enquiries']
    ok('enquiry stored with course title and ENQ ID', bool(enq) and enq[-1]['Course'] == 'Confined Space Entry' and enq[-1]['Enquiry ID'].startswith('ENQ-'))

    # Direct API abuse checks through the real server
    import urllib.error
    def post(path, body, headers):
        req = urllib.request.Request(API + path, data=body.encode(), headers=headers, method='POST')
        try: return urllib.request.urlopen(req).status
        except urllib.error.HTTPError as h: return h.code
    ok('cross-origin POST rejected (403)', post('/api/applications', '{}', {'content-type': 'application/json', 'origin': 'https://evil.example', 'host': 'localhost:3001'}) == 403)
    ok('form-encoded POST rejected (415)', post('/api/enquiries', 'a=b', {'content-type': 'application/x-www-form-urlencoded'}) == 415)
    ok('no browser errors', not errs)
    b.close()

print('\n'.join(log))
failed = [l for l in log if l.startswith('FAIL')]
print(f"\n{len(log) - len(failed)}/{len(log)} passed")
sys.exit(1 if failed else 0)
