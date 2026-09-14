import { useEffect } from 'react'
import { site } from '../config/site'

/**
 * Injects one JSON-LD <script> per call, removed on unmount/update.
 * `id` must be unique per concurrent script on the page (e.g. 'org', 'breadcrumbs', 'course').
 */
export function useStructuredData(id: string, data: object | null) {
  useEffect(() => {
    if (!data) {
      // No data for this id right now — remove any stale tag a previous prerendered
      // build may have left behind, rather than leaving it stuck in the DOM.
      document.head.querySelector<HTMLScriptElement>(`script[data-ld-id="${id}"]`)?.remove()
      return
    }
    let el = document.head.querySelector<HTMLScriptElement>(`script[data-ld-id="${id}"]`)
    if (!el) {
      el = document.createElement('script')
      el.type = 'application/ld+json'
      el.dataset.ldId = id
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(data)
    return () => {
      document.head.querySelector<HTMLScriptElement>(`script[data-ld-id="${id}"]`)?.remove()
    }
  }, [id, data])
}

/** Absolute URL for a site-relative path, or '' if VITE_SITE_URL is not set (see .env.example). */
export function absoluteUrl(path: string): string {
  return site.url ? `${site.url}${path === '/' ? '/' : path}` : ''
}

export type BreadcrumbItem = { label: string; path?: string }

/** BreadcrumbList structured data matching the visible <Breadcrumbs> trail on a page. */
export function breadcrumbList(items: BreadcrumbItem[]) {
  if (!site.url) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  }
}

/**
 * Sitewide EducationalOrganization / CollegeOrUniversity data.
 * Rendered once, in SiteLayout, so it is present on every page.
 * No ranking, accreditation or founding-date claims are made — only what is confirmed.
 */
export function organizationData() {
  if (!site.url) return null
  return {
    '@context': 'https://schema.org',
    '@type': ['CollegeOrUniversity', 'EducationalOrganization'],
    name: site.centre.fullName,
    alternateName: site.centre.shortName,
    url: site.url,
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: site.institution.name,
      url: site.institution.website,
    },
    email: site.contact.email,
    telephone: site.contact.phones[0]?.tel,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.address.join(', '),
      addressCountry: 'NG',
    },
  }
}

/** schema.org/Course data for one programme page. */
export function courseData(input: {
  path: string
  name: string
  description: string
  durationMonths: number | null
  feeNaira: number | null
}) {
  if (!site.url) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: {
      '@type': 'CollegeOrUniversity',
      name: site.centre.fullName,
      sameAs: site.url,
    },
    ...(input.durationMonths
      ? {
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'onsite',
            duration: `P${input.durationMonths}M`,
          },
        }
      : {}),
    ...(input.feeNaira !== null
      ? {
          offers: {
            '@type': 'Offer',
            category: 'Application fee',
            price: input.feeNaira,
            priceCurrency: 'NGN',
            url: `${site.url}/apply`,
          },
        }
      : {}),
  }
}
