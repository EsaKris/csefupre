/**
 * LOCAL TESTING ONLY. Serves dist/ while applying the exact header rules from
 * vercel.json, so headers (especially CSP) can be verified with a real
 * browser before trusting them on Vercel. Not used in production — Vercel
 * applies vercel.json itself.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const PORT = Number(process.argv[2] || 4200)
const DIST = 'dist'
const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

function toRegExp(source: string): RegExp {
  // vercel.json "source" values are already regex-like (Vercel supports full regex,
  // including lookaheads such as the one used for the SPA rewrite) — just anchor them.
  return new RegExp('^' + source + '$')
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  let pathname = decodeURIComponent(url.pathname)

  let filePath = join(DIST, pathname)
  let served = existsSync(filePath) && statSync(filePath).isFile()
  if (!served && existsSync(join(filePath, 'index.html'))) {
    filePath = join(filePath, 'index.html')
    served = true
  }
  if (!served) {
    // Static-file precedence first (as on Vercel); only then apply rewrites.
    const rewrite = config.rewrites.find((r) => toRegExp(r.source).test(pathname))
    if (rewrite) {
      filePath = join(DIST, rewrite.destination)
      served = existsSync(filePath)
    }
  }

  const headers: Record<string, string> = {}
  for (const block of config.headers) {
    if (toRegExp(block.source).test(pathname)) {
      for (const h of block.headers) headers[h.key] = h.value
    }
  }

  if (!served) {
    res.writeHead(404, headers)
    res.end('Not found')
    return
  }

  const ext = extname(filePath)
  headers['Content-Type'] = CONTENT_TYPES[ext] || 'application/octet-stream'
  res.writeHead(200, headers)
  res.end(readFileSync(filePath))
}).listen(PORT, () => console.log(`Serving dist/ with vercel.json headers on http://localhost:${PORT}`))
