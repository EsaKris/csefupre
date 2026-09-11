import { careerPaths, CAREERS_NOTICE } from '../../config/careers'
import { Link } from 'react-router'

export function CareersCompact() {
  return (
    <>
      <ul className="grid gap-x-8 sm:grid-cols-2">
        {careerPaths.map((c) => (
          <li key={c} className="flex items-center gap-3 border-b border-rule py-2.5">
            <span className="h-2 w-2 shrink-0 bg-green-700" aria-hidden="true" />
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.9375rem] text-muted">{CAREERS_NOTICE}</p>
      <p className="mt-4">
        <Link to="/careers" className="link font-semibold">
          Read about these career paths
        </Link>
      </p>
    </>
  )
}
