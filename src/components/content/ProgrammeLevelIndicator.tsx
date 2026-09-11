import { Link } from 'react-router'
import { programmes } from '../../config/programmes'

/** Compact version of the homepage ladder: shows where a programme sits in the progression. */
export function ProgrammeLevelIndicator({ current }: { current: number }) {
  const heights = ['h-3', 'h-5', 'h-7', 'h-9']
  return (
    <nav aria-label="Programme levels" className="mt-8">
      <ol className="flex items-end gap-1.5">
        {programmes.map((p, i) => {
          const isCurrent = p.level === current
          return (
            <li key={p.slug}>
              <Link
                to={p.path}
                aria-current={isCurrent ? 'page' : undefined}
                className="group flex flex-col items-start gap-1.5"
                title={p.shortTitle}
              >
                <span
                  className={`block w-14 xs:w-16 sm:w-20 ${heights[i]} border-t-2 ${
                    isCurrent ? 'border-gold bg-gold' : 'border-white/40 bg-white/15 group-hover:bg-white/30'
                  }`}
                  aria-hidden="true"
                />
                <span className={`text-xs ${isCurrent ? 'font-semibold text-white' : 'text-green-100'}`}>
                  <span className="sr-only">{p.shortTitle}, </span>Level {p.level}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
