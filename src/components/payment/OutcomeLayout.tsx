import type { ReactNode } from 'react'
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { Container } from '../ui/Container'
import { logos } from '../../config/images'
import { site } from '../../config/site'
import { LogoMark } from '../ui/LogoMark'

type Tone = 'success' | 'pending' | 'failed' | 'review'

const toneStyle: Record<Tone, { bar: string; icon: typeof CheckCircle2; iconClass: string }> = {
  success: { bar: 'border-t-green-800', icon: CheckCircle2, iconClass: 'text-green-700' },
  pending: { bar: 'border-t-gold', icon: Clock, iconClass: 'text-gold-ink' },
  failed: { bar: 'border-t-danger', icon: XCircle, iconClass: 'text-danger' },
  review: { bar: 'border-t-gold', icon: AlertTriangle, iconClass: 'text-gold-ink' },
}

export function OutcomeLayout({
  tone,
  title,
  lead,
  children,
  actions,
}: {
  tone: Tone
  title: string
  lead: ReactNode
  children?: ReactNode
  actions?: ReactNode
}) {
  const t = toneStyle[tone]
  return (
    <Container className="py-10 sm:py-14">
      <section
        aria-labelledby="outcome-heading"
        className={`mx-auto max-w-[46rem] border border-rule border-t-4 bg-white print:max-w-none print:border-0 ${t.bar}`}
      >
        {/* Letterhead, shown on screen and in print */}
        <div className="flex items-center gap-4 border-b border-rule px-6 py-4 sm:px-8">
          <LogoMark logo={logos.fupre} placeholderText="FUPRE" className="h-12 w-12" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-green-700">{site.institution.name}</p>
            <p className="font-display text-lg font-semibold text-green-950">{site.centre.name}</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-3">
            <t.icon aria-hidden="true" className={`h-8 w-8 shrink-0 ${t.iconClass}`} strokeWidth={2} />
            <span role="status" className="sr-only">
              {title}
            </span>
          </p>
          <h1 id="outcome-heading" className="mt-3 text-[2.25rem] font-semibold leading-tight text-green-950 sm:text-[2.625rem]">
            {title}
          </h1>
          <div className="mt-3 text-[1.125rem] leading-relaxed text-slate">{lead}</div>
          {children}
          {actions ? <div className="mt-8 flex flex-col gap-3 xs:flex-row xs:flex-wrap print:hidden">{actions}</div> : null}
        </div>
      </section>
    </Container>
  )
}

export function DetailList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-6 divide-y divide-rule border-y border-rule">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-muted">{k}</dt>
          <dd className="break-words font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export const primaryBtn =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-green-800 px-5 font-display text-[1.0625rem] font-semibold text-white hover:bg-green-950'
export const secondaryBtn =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius)] border border-green-800 px-5 font-display text-[1.0625rem] font-semibold text-green-800 hover:bg-green-50'
