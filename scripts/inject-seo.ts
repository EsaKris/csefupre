/**
 * Runs on every Vercel build (part of `npm run build`). Pure Node — no
 * browser, so it cannot fail due to a missing/incompatible Chromium binary
 * on the build machine. Reads the committed JSON fragments in public/seo/
 * (see scripts/extract-seo.ts) and writes dist/<route>/index.html for each
 * one, with real per-route <title>/meta/canonical/JSON-LD baked into the
 * initial HTML.
 *
 * Vercel serves a matching static file before falling back to the SPA
 * rewrite (see vercel.json), so these are what crawlers and link-preview
 * bots (WhatsApp, Facebook, X) see, while real visitors still get the
 * normal client-rendered app underneath — the <div id="root"> is left
 * empty; React mounts into it exactly as it does for '/'.
 *
 * If public/seo/ is missing or empty (e.g. a fresh checkout before anyone
 * has run the local extraction step), this script leaves dist/ untouched
 * and prints a warning rather than failing the build.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const SEO_DIR = 'public/seo'

type Fragment = {
  path: string
  title: string
  description: string | null
  robots: string | null
  ogTitle: string | null
  ogDescription: string | null
  canonical: string | null
  ld: { id: string; json: string }[]
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function setOrAddMeta(html: string, selectorAttr: 'name' | 'property', key: string, content: string): string {
  const re = new RegExp(`<meta\\s+${selectorAttr}="${key}"[^>]*>`, 'i')
  const tag = `<meta ${selectorAttr}="${key}" content="${escapeHtml(content)}" />`
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`)
}

function buildHtml(template: string, f: Fragment): string {
  let html = template
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(f.title)}</title>`)
  if (f.description) html = setOrAddMeta(html, 'name', 'description', f.description)
  html = setOrAddMeta(html, 'name', 'robots', f.robots ?? 'index, follow')
  if (f.ogTitle) html = setOrAddMeta(html, 'property', 'og:title', f.ogTitle)
  if (f.ogDescription) html = setOrAddMeta(html, 'property', 'og:description', f.ogDescription)
  if (f.canonical) {
    const linkRe = /<link\s+rel="canonical"[^>]*>/i
    const tag = `<link rel="canonical" href="${escapeHtml(f.canonical)}" />`
    html = linkRe.test(html) ? html.replace(linkRe, tag) : html.replace('</head>', `  ${tag}\n</head>`)
    html = setOrAddMeta(html, 'property', 'og:url', f.canonical)
  }
  const ldScripts = f.ld.map((entry) => `  <script type="application/ld+json" data-ld-id="${entry.id}">${entry.json}</script>`).join('\n')
  if (ldScripts) html = html.replace('</head>', `${ldScripts}\n</head>`)
  return html
}

function main() {
  if (!existsSync(`${DIST}/index.html`)) {
    console.error(`${DIST}/index.html not found — run "vite build" before this script.`)
    process.exit(1)
  }
  if (!existsSync(SEO_DIR) || readdirSync(SEO_DIR).filter((f) => f.endsWith('.json')).length === 0) {
    console.warn(`\n⚠ ${SEO_DIR} has no fragments — skipping per-route prerendering this build.`)
    console.warn('  Every route still works (served by the SPA shell); only per-route <head>')
    console.warn('  tags and JSON-LD for link previews / crawlers are missing until someone')
    console.warn('  runs scripts/extract-seo.ts locally and commits public/seo/.\n')
    return
  }

  const template = readFileSync(`${DIST}/index.html`, 'utf8')
  const files = readdirSync(SEO_DIR).filter((f) => f.endsWith('.json'))
  let written = 0

  for (const file of files) {
    const fragment = JSON.parse(readFileSync(join(SEO_DIR, file), 'utf8')) as Fragment
    const html = buildHtml(template, fragment)
    const outDir = fragment.path === '/' ? DIST : join(DIST, fragment.path)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html)
    written++
  }

  // Build-time-only input; not meant to be a public URL in the deployed output.
  rmSync(join(DIST, 'seo'), { recursive: true, force: true })

  console.log(`Prerendered ${written} route(s) with real <head> tags and structured data.`)
}

main()
