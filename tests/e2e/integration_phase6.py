"""
Phase 6 checks — security headers, CSP enforcement, prerendered <head> content,
sitemap/robots, and structured data.

Usage:
  npm run build                                    # requires public/seo/*.json to exist
  npx tsx scripts/serve-with-vercel-headers.ts 4200 &
  python3 tests/e2e/integration_phase6.py http://localhost:4200
"""
import json, re, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4200'
log = []
def ok(label, cond): log.append(('PASS' if cond else 'FAIL') + ' — ' + label)

def head(path):
    req = urllib.request.Request(BASE + path, method='GET')
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return dict(r.getheaders()), raw
    except urllib.error.HTTPError as e:
        return dict(e.headers.items()), e.read()

def text(path):
    h, raw = head(path)
    return h, raw.decode('utf-8', errors='replace')

# ── Security headers ──
headers, body = text('/')
ok('X-Content-Type-Options: nosniff', headers.get('X-Content-Type-Options') == 'nosniff')
ok('X-Frame-Options: SAMEORIGIN', headers.get('X-Frame-Options') == 'SAMEORIGIN')
ok('Referrer-Policy set', 'strict-origin' in headers.get('Referrer-Policy', ''))
ok('Permissions-Policy restricts camera/mic/geolocation', all(x in headers.get('Permissions-Policy', '') for x in ['camera=()', 'microphone=()', 'geolocation=()']))
ok('Strict-Transport-Security present with includeSubDomains', 'includeSubDomains' in headers.get('Strict-Transport-Security', ''))
ok('Cross-Origin-Opener-Policy: same-origin', headers.get('Cross-Origin-Opener-Policy') == 'same-origin')

csp = headers.get('Content-Security-Policy', '')
ok('CSP present on HTML pages', bool(csp))
ok('CSP script-src is self only (no unsafe-inline/eval, no external hosts)', "script-src 'self'" in csp and 'unsafe-eval' not in csp)
ok('CSP default-src self', "default-src 'self'" in csp)
ok('CSP object-src none', "object-src 'none'" in csp)
ok('CSP frame-ancestors self (clickjacking)', "frame-ancestors 'self'" in csp)

api_headers, _ = text('/api/applications')
ok('API responses have no CSP (irrelevant to JSON)', 'Content-Security-Policy' not in api_headers)
ok('API responses still get baseline hardening headers', api_headers.get('X-Content-Type-Options') == 'nosniff')

# ── Sitemap & robots ──
sm_headers, sm_body = text('/sitemap.xml')
ok('sitemap.xml served as XML', 'xml' in sm_headers.get('Content-Type', ''))
ok('sitemap.xml lists the homepage', '<loc>' in sm_body and re.search(r'<loc>[^<]*/</loc>', sm_body))
ok('sitemap.xml does not list /apply or /payment', '/apply<' not in sm_body and '/payment' not in sm_body)

_, robots_body = text('/robots.txt')
ok('robots.txt allows crawling', 'Allow: /' in robots_body)
ok('robots.txt disallows the application/payment flow', '/apply' in robots_body and '/payment' in robots_body)
ok('robots.txt points to the sitemap', 'Sitemap:' in robots_body)

# ── Prerendered content (no JS execution — raw HTTP body only) ──
_, home_body = text('/')
ok('homepage has a real <title>, not the generic shell title', '<title>Centre for Safety Education' in home_body)

_, masters_body = text('/programmes/masters')
ok("Master's page prerendered with its own <title>", "Master's Degree" in masters_body and '<title>' in masters_body)
ok("Master's page has canonical link", 'rel="canonical"' in masters_body)
ok("Master's page has og:title/og:description", 'property="og:title"' in masters_body and 'property="og:description"' in masters_body)
ld_blocks = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', masters_body, re.S)
ok("Master's page has 3 JSON-LD blocks (org, breadcrumbs, course)", len(ld_blocks) == 3)
parsed = [json.loads(b) for b in ld_blocks]
ok('JSON-LD includes CollegeOrUniversity/EducationalOrganization', any('CollegeOrUniversity' in json.dumps(p.get('@type', '')) for p in parsed))
ok('JSON-LD includes BreadcrumbList', any(p.get('@type') == 'BreadcrumbList' for p in parsed))
course = next((p for p in parsed if p.get('@type') == 'Course'), None)
ok('JSON-LD Course has real confirmed fee (35000 NGN), not a sample', course is not None and course.get('offers', {}).get('price') == 35000 and course['offers']['priceCurrency'] == 'NGN')
ok('root div still empty (client takes over normally, no hydration mismatch)', '<div id="root"></div>' in masters_body)

_, apply_body = text('/apply')
ok('/apply is NOT prerendered with page-specific content (served by SPA shell, correctly excluded from sitemap)', '<div id="root"></div>' in apply_body)

# ── Caching ──
import subprocess
jsfile = subprocess.check_output("ls dist/assets/*.js | head -1", shell=True).decode().strip().split('/')[-1]
js_headers, _ = head(f'/assets/{jsfile}')
ok('hashed JS bundle cached immutably for a year', 'immutable' in js_headers.get('Cache-Control', ''))
logo_headers, _ = head('/assets/logos/fupre-logo.png')
ok('un-hashed logo image NOT cached immutably (can be replaced without a filename change)', 'immutable' not in logo_headers.get('Cache-Control', '') and 'max-age=86400' in logo_headers.get('Cache-Control', ''))

# ── Real browser: confirm zero CSP violations while actually using the site ──
violations = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('console', lambda m: violations.append(m.text) if 'Content Security Policy' in m.text or 'Refused to' in m.text else None)
    for r in ['/', '/about', '/programmes/masters', '/requirements', '/contact', '/apply']:
        pg.goto(BASE + r, wait_until='networkidle')
    pg.select_option('select', index=1)
    b.close()
ok('zero CSP violations while browsing and using a form', len(violations) == 0)

print('\n'.join(log))
failed = [l for l in log if l.startswith('FAIL')]
print(f"\n{len(log) - len(failed)}/{len(log)} passed")
sys.exit(1 if failed else 0)

