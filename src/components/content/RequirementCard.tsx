import { Link } from 'react-router'
import type { Programme } from '../../config/programmes'
import { displayName, formatDuration } from '../../config/programmes'

type Props = { programme: Programme; showLink?: boolean; headingLevel?: 'h2' | 'h3' }

export function RequirementList({ programme }: { programme: Programme }) {
  const { items, alternatives } = programme.requirements
  if (!alternatives) return <p>{items[0]}</p>
  return (
    <ul className="space-y-2">
      {items.map((req, i) => (
        <li key={req} className="flex gap-2">
          {i > 0 ? <span className="shrink-0 font-semibold text-green-700">or</span> : null}
          <span>{req}</span>
        </li>
      ))}
    </ul>
  )
}

export function RequirementCard({ programme, showLink = true, headingLevel: H = 'h3' }: Props) {
  return (
    <article className="flex h-full flex-col border border-rule border-t-4 border-t-green-800 bg-white p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-sm font-semibold text-green-700">Level {programme.level}</p>
        <p className="text-sm text-muted">{formatDuration(programme)}</p>
      </div>
      <H className="mt-2 text-[1.5rem] font-semibold text-green-950">{displayName(programme)}</H>
      <div className="mt-4 flex-1 text-[1.0625rem] leading-relaxed text-ink">
        <p className="mb-2 text-sm font-semibold text-muted">Entry requirement</p>
        <RequirementList programme={programme} />
      </div>
      {showLink ? (
        <p className="mt-6 border-t border-rule pt-4">
          <Link to={programme.path} className="link font-semibold">
            Programme details<span className="sr-only"> for {programme.shortTitle}</span>
          </Link>
        </p>
      ) : null}
    </article>
  )
}
