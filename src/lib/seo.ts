import { useEffect } from 'react'
import { site } from '../config/site'

type PageMeta = {
  title: string
  description: string
  /** Route path, e.g. '/about'. Used for canonical and og:url. */
  path: string
  /** Set false for pages that should not be indexed (payment, success states) */
  index?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Client-side meta management.
 * Phase 6 adds build-time prerendering so these tags exist in the static HTML
 * for WhatsApp/Facebook/X link previews, which do not run JavaScript.
 */
export function usePageMeta({ title, description, path, index = true }: PageMeta) {
  useEffect(() => {
    const fullTitle = path === '/' ? `${site.centre.name} | ${site.institution.shortName}` : `${title} | ${site.centre.shortName}, ${site.institution.shortName}`
    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', index ? 'index, follow' : 'noindex, nofollow')
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', site.centre.fullName)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    if (site.url) {
      const url = `${site.url}${path === '/' ? '/' : path}`
      setCanonical(url)
      setMeta('property', 'og:url', url)
    }
  }, [title, description, path, index])
}
