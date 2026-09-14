/**
 * Generates public/sitemap.xml and public/robots.txt before the Vite build
 * (public/ is copied into dist/ verbatim, so these ship as static files).
 *
 * Requires VITE_SITE_URL. Without it, this script still runs (so `npm run
 * build` never breaks locally) but writes an obvious placeholder domain and
 * prints a warning — set VITE_SITE_URL in Vercel before relying on the output.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { routes } from './routes'
import { loadLocalEnv } from './loadEnv'

loadLocalEnv()

const PLACEHOLDER = 'https://your-domain-not-set.example'
const rawUrl = process.env.VITE_SITE_URL?.trim().replace(/\/$/, '')
const siteUrl = rawUrl || PLACEHOLDER

if (!rawUrl) {
  console.warn('\n⚠ VITE_SITE_URL is not set — sitemap.xml will contain placeholder URLs.')
  console.warn('  Set it in Vercel (or .env.local for a local check) before deploying.\n')
}

const today = new Date().toISOString().slice(0, 10)

const urlEntries = routes
  .map(
    (r) => `  <url>
    <loc>${siteUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

const robots = `User-agent: *
Allow: /
Disallow: /apply
Disallow: /payment
Disallow: /payment/status
Disallow: /application-success
Disallow: /application-payment-pending
Disallow: /application-payment-failed

Sitemap: ${siteUrl}/sitemap.xml
`

if (!existsSync('public')) mkdirSync('public')
writeFileSync('public/sitemap.xml', sitemap)
writeFileSync('public/robots.txt', robots)
console.log(`Generated public/sitemap.xml (${routes.length} URLs) and public/robots.txt`)
