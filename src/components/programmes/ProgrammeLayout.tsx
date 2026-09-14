import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Programme } from '../../config/programmes'
import { displayName, formatDuration, REQUIREMENTS_NOTICE } from '../../config/programmes'
import { site } from '../../config/site'
import { Container } from '../ui/Container'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ButtonLink } from '../ui/Button'
import { Notice } from '../ui/Notice'
import { CTASection } from '../ui/CTASection'
import { RequirementList } from '../content/RequirementCard'
import { ProgrammeLevelIndicator } from '../content/ProgrammeLevelIndicator'
import { Tbd } from '../ui/Tbd'
import { Fee } from '../ui/Fee'
import { APPLICATION_FEES } from '../../../shared/fees'
import { useStructuredData, courseData } from '../../lib/structuredData'

export function applyPath(p: Programme) {
  return `/apply?programme=${p.slug}`
}

export function ProgrammeHeader({ programme }: { programme: Programme }) {
  const p = programme
  return (
    <header className="border-b-4 border-gold bg-green-900 text-white">
      <Container className="py-10 sm:py-14">
        <Breadcrumbs items={[{ label: 'Programmes', to: '/programmes' }, { label: p.abbreviation ?? p.shortTitle }]} tone="dark" />
        <p className="mt-7 font-display text-lg font-semibold text-gold-soft">Level {p.level} of 4</p>
        <h1 className="mt-2 max-w-[26ch] text-[2.25rem] font-semibold leading-[1.05] sm:text-[3.25rem]">{p.title}</h1>
        <p className="mt-5 max-w-[42rem] text-lg leading-relaxed text-green-100">{p.summary}</p>

        <dl className="mt-8 grid max-w-[34rem] grid-cols-1 gap-px bg-white/15 xs:grid-cols-2">
          <div className="bg-green-900 py-3 pr-4">
            <dt className="text-sm text-green-100">Duration</dt>
            <dd className="mt-1 font-display text-xl font-semibold">
              {p.durationMonths ? formatDuration(p) : <span className="text-white/90">To be confirmed</span>}
            </dd>
          </div>
          <div className="bg-green-900 py-3 xs:pl-4">
            <dt className="text-sm text-green-100">Entry</dt>
            <dd className="mt-1 font-display text-xl font-semibold">{p.entryShort}</dd>
          </div>
        </dl>

        <div className="mt-9 flex flex-col gap-3 xs:flex-row">
          <ButtonLink to={applyPath(p)} variant="onDark">
            Apply for this programme
          </ButtonLink>
          <ButtonLink to="/contact?topic=Programmes" variant="onDarkOutline">
            Ask a question
          </ButtonLink>
        </div>

        <ProgrammeLevelIndicator current={p.level} />
      </Container>
    </header>
  )
}

function AtAGlance({ programme }: { programme: Programme }) {
  const p = programme
  return (
    <aside aria-labelledby="glance-heading" className="lg:sticky lg:top-24">
      <div className="border border-rule border-t-4 border-t-green-800 bg-white">
        <h2 id="glance-heading" className="px-6 pt-5 text-[1.375rem] font-semibold text-green-950">
          At a glance
        </h2>
        <dl className="mt-3 divide-y divide-rule px-6 text-[0.9375rem]">
          <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
            <dt className="text-muted">Programme</dt>
            <dd className="font-semibold">{displayName(p)}</dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
            <dt className="text-muted">Field</dt>
            <dd>{p.field}</dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
            <dt className="text-muted">Duration</dt>
            <dd>{p.durationMonths ? formatDuration(p) : <Tbd>To be confirmed by the Centre</Tbd>}</dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
            <dt className="text-muted">Application fee</dt>
            <dd>
              <Fee amount={APPLICATION_FEES[p.slug]} size="sm" />
            </dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
            <dt className="text-muted">Entry</dt>
            <dd>
              <RequirementList programme={p} />
            </dd>
          </div>
        </dl>
        <div className="grid gap-3 border-t border-rule p-6">
          <ButtonLink to={applyPath(p)}>Apply Now</ButtonLink>
          <ButtonLink to="/brochure" variant="secondary">
            Admission brochure
          </ButtonLink>
        </div>
      </div>
      <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
        Questions?{' '}
        <a href={`mailto:${site.contact.email}`} className="link">
          {site.contact.email}
        </a>{' '}
        or{' '}
        <a href={`tel:${site.contact.phones[0].tel}`} className="link">
          {site.contact.phones[0].display}
        </a>
      </p>
    </aside>
  )
}

export function ProgrammeSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24 border-t border-rule py-10 first:border-t-0 first:pt-0">
      <h2 id={id} className="text-[1.875rem] font-semibold text-green-950 sm:text-[2.125rem]">
        {title}
      </h2>
      <div className="mt-4 max-w-[42rem] text-[1.0625rem] leading-[1.7] text-ink">{children}</div>
    </section>
  )
}

export function RequirementsBlock({ programme }: { programme: Programme }) {
  return (
    <>
      <div className="border-l-4 border-green-800 bg-green-50 px-6 py-5 text-[1.125rem]">
        <RequirementList programme={programme} />
      </div>
      <Notice className="mt-5">{REQUIREMENTS_NOTICE}</Notice>
      <p className="mt-5">
        <Link to="/requirements" className="link font-semibold">
          Check which programme matches your qualification
        </Link>
      </p>
    </>
  )
}

export function FocusList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((f) => (
        <li key={f} className="border border-green-800/30 bg-white px-3.5 py-1.5 font-display text-[1.0625rem] font-medium text-green-900">
          {f}
        </li>
      ))}
    </ul>
  )
}

export function PendingList({ label }: { label: string }) {
  return (
    <p>
      <Tbd>{label}</Tbd>
    </p>
  )
}

export function ProgrammeLayout({ programme: p, children }: { programme: Programme; children: ReactNode }) {
  useStructuredData(
    'course',
    courseData({ path: p.path, name: p.title, description: p.summary, durationMonths: p.durationMonths, feeNaira: APPLICATION_FEES[p.slug] }),
  )
  return (
    <>
      <ProgrammeHeader programme={p} />
      <Container className="grid gap-12 py-14 sm:py-16 lg:grid-cols-12">
        <div className="lg:col-span-8">{children}</div>
        <div className="lg:col-span-4">
          <AtAGlance programme={p} />
        </div>
      </Container>
      <CTASection
        heading={`Apply for the ${p.shortTitle}`}
        applyTo={applyPath(p)}
        applyLabel="Apply Now"
      />
    </>
  )
}

