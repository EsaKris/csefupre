/**
 * Canonical list of public, indexable routes.
 * Used by both the sitemap/robots generator and the prerender script, so the two
 * can never drift apart. Dynamic/session pages (apply, payment, outcome pages,
 * 404) are deliberately excluded — see each page's `usePageMeta({ index: false })`.
 */

export type RouteEntry = {
  path: string
  /** Relative priority for sitemap.xml, 0.0–1.0 */
  priority: number
  changefreq: 'weekly' | 'monthly' | 'yearly'
}

export const routes: RouteEntry[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/about', priority: 0.8, changefreq: 'monthly' },
  { path: '/programmes', priority: 0.9, changefreq: 'monthly' },
  { path: '/programmes/professional-diploma', priority: 0.8, changefreq: 'monthly' },
  { path: '/programmes/pgd', priority: 0.8, changefreq: 'monthly' },
  { path: '/programmes/masters', priority: 0.8, changefreq: 'monthly' },
  { path: '/programmes/phd', priority: 0.8, changefreq: 'monthly' },
  { path: '/admissions', priority: 0.9, changefreq: 'monthly' },
  { path: '/requirements', priority: 0.7, changefreq: 'monthly' },
  { path: '/courses', priority: 0.7, changefreq: 'monthly' },
  { path: '/careers', priority: 0.6, changefreq: 'monthly' },
  { path: '/contact', priority: 0.6, changefreq: 'yearly' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/brochure', priority: 0.5, changefreq: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
]
