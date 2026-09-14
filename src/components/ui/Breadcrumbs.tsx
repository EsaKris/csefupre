import { Link, useLocation } from 'react-router'
import { useStructuredData, breadcrumbList } from '../../lib/structuredData'

export type Crumb = { label: string; to?: string }

export function Breadcrumbs({ items, tone = 'light' }: { items: Crumb[]; tone?: 'light' | 'dark' }) {
  const { pathname } = useLocation()
  const all: Crumb[] = [{ label: 'Home', to: '/' }, ...items]

  // The visible trail is the single source of truth for BreadcrumbList — they can never disagree.
  useStructuredData(
    'breadcrumbs',
    breadcrumbList(all.map((c, i) => ({ label: c.label, path: i === all.length - 1 ? pathname : c.to }))),
  )

  const linkClass = tone === 'dark' ? 'text-green-100 hover:text-white' : 'text-green-700 hover:text-green-950'
  const currentClass = tone === 'dark' ? 'text-white' : 'text-ink'
  const sepClass = tone === 'dark' ? 'text-white/40' : 'text-rule-strong'

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {all.map((c, i) => {
          const last = i === all.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.to && !last ? (
                <Link to={c.to} className={`underline-offset-4 hover:underline ${linkClass}`}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={currentClass}>
                  {c.label}
                </span>
              )}
              {!last ? (
                <span aria-hidden="true" className={sepClass}>
                  /
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
