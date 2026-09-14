/**
 * LOCAL / CI-ONLY — not run during a normal Vercel build.
 *
 * Visits every indexable route on a running preview server, reads the <title>,
 * meta tags and JSON-LD that the app itself sets client-side (usePageMeta,
 * useStructuredData), and writes one small JSON fragment per route to
 * public/seo/. These committed fragments are what `scripts/inject-seo.ts`
 * stitches into static HTML at every Vercel build — that step needs no
 * browser at all, so it can never fail on Vercel's build machine.
 *
 * Re-run this (and commit the result) whenever page titles, descriptions,
 * breadcrumbs, or structured data change:
 *
 *   npm run build                  # builds once so the preview below matches production
 *   npx vite preview --port 4190 &
 *   npm run extract-seo -- http://localhost:4190
 *
 * Requires: npx playwright install chromium   (one-time, local machine only)
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { routes } from './routes'

const base = process.argv[2] || 'http://localhost:4190'

function findLocalChromium(): string | undefined {
  // Reuses a locally-installed Playwright Chromium if one is already present,
  // so contributors don't need a second browser download on top of the
  // Python one some environments (including this project's own test suite) use.
  try {
    return chromium.executablePath()
  } catch {
    return undefined
  }
}

async function main() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || findLocalChromium()
  const browser = await chromium.launch(executablePath ? { executablePath } : {})
  const page = await browser.newPage()

  if (!existsSync('public/seo')) mkdirSync('public/seo', { recursive: true })

  for (const route of routes) {
    await page.goto(`${base}${route.path}`, { waitUntil: 'networkidle' })
    const extracted = (await page.evaluate(
      `(function () {
        function meta(name) { var el = document.querySelector('meta[name="' + name + '"]'); return el ? el.getAttribute('content') : null }
        function prop(name) { var el = document.querySelector('meta[property="' + name + '"]'); return el ? el.getAttribute('content') : null }
        var canonicalEl = document.querySelector('link[rel="canonical"]')
        var canonical = canonicalEl ? canonicalEl.getAttribute('href') : null
        var ldNodes = document.querySelectorAll('script[type="application/ld+json"]')
        var ld = []
        for (var i = 0; i < ldNodes.length; i++) {
          ld.push({ id: ldNodes[i].getAttribute('data-ld-id') || 'unknown', json: ldNodes[i].textContent || '' })
        }
        return {
          title: document.title,
          description: meta('description'),
          robots: meta('robots'),
          ogTitle: prop('og:title'),
          ogDescription: prop('og:description'),
          canonical: canonical,
          ld: ld,
        }
      })()`,
    )) as {
      title: string
      description: string | null
      robots: string | null
      ogTitle: string | null
      ogDescription: string | null
      canonical: string | null
      ld: { id: string; json: string }[]
    }

    const slug = route.path === '/' ? 'home' : route.path.replace(/^\//, '').replace(/\//g, '_')
    writeFileSync(`public/seo/${slug}.json`, JSON.stringify({ path: route.path, ...extracted }, null, 2) + '\n')
    console.log(`✓ ${route.path.padEnd(32)} → public/seo/${slug}.json`)
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
