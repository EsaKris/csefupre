import { Link } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { images } from '../config/images'
import { programmes, displayName, formatDuration, REQUIREMENTS_NOTICE } from '../config/programmes'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { CTASection } from '../components/ui/CTASection'
import { RequirementList } from '../components/content/RequirementCard'
import { FocusList, applyPath } from '../components/programmes/ProgrammeLayout'

export default function Programmes() {
  usePageMeta({
    title: 'Programmes',
    path: '/programmes',
    description:
      "Professional Diploma, Postgraduate Diploma, Master's Degree and Ph.D. in Health, Environment, Safety and Security at the Centre for Safety Education, FUPRE — durations, entry requirements and focus.",
  })

  return (
    <>
      <PageHeader
        title="Programmes"
        crumbs={[{ label: 'Programmes' }]}
        intro="Four programmes in Health, Environment, Safety and Security, forming a progression from professional diploma to doctorate."
        image={images.programmesHeader}
      />

      {/* Comparison */}
      <section aria-labelledby="compare-heading" className="py-14 sm:py-16">
        <Container>
          <h2 id="compare-heading" className="text-[2rem] font-semibold text-green-950">
            Compare programmes
          </h2>

          <div className="mt-8 hidden md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Programme duration and entry requirements</caption>
              <thead>
                <tr className="border-b-2 border-green-900 text-sm text-muted">
                  <th scope="col" className="py-3 pr-6 font-semibold">Programme</th>
                  <th scope="col" className="py-3 pr-6 font-semibold">Duration</th>
                  <th scope="col" className="py-3 pr-6 font-semibold">Entry requirement</th>
                  <th scope="col" className="py-3 font-semibold"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((p) => (
                  <tr key={p.slug} className="border-b border-rule align-top">
                    <th scope="row" className="py-5 pr-6">
                      <span className="block font-display text-sm font-semibold text-green-700">Level {p.level}</span>
                      <a href={`#${p.slug}`} className="font-display text-[1.375rem] font-semibold text-green-950 hover:underline">
                        {displayName(p)}
                      </a>
                    </th>
                    <td className="py-5 pr-6 font-display text-lg font-semibold text-green-800">{formatDuration(p)}</td>
                    <td className="py-5 pr-6 text-[1.0625rem]"><RequirementList programme={p} /></td>
                    <td className="py-5 text-right">
                      <Link to={p.path} className="link whitespace-nowrap font-semibold">
                        Full details<span className="sr-only"> for {p.shortTitle}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-8 grid gap-3 md:hidden">
            {programmes.map((p) => (
              <li key={p.slug} className="border border-rule p-4">
                <a href={`#${p.slug}`} className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-xl font-semibold text-green-950">{displayName(p)}</span>
                  <span className="shrink-0 text-sm text-muted">{formatDuration(p)}</span>
                </a>
                <p className="mt-1 text-[0.9375rem] text-slate">Entry: {p.entryShort}</p>
              </li>
            ))}
          </ul>

          <Notice className="mt-8 max-w-[48rem]">{REQUIREMENTS_NOTICE}</Notice>
        </Container>
      </section>

      {/* Programme entries */}
      <div className="bg-paper">
        {programmes.map((p) => (
          <section key={p.slug} id={p.slug} aria-labelledby={`${p.slug}-title`} className="scroll-mt-20 border-b border-rule last:border-b-0">
            <Container className="grid gap-10 py-14 sm:py-16 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="font-display text-lg font-semibold text-green-700">
                  Level {p.level} <span className="text-muted">/</span> {formatDuration(p)}
                </p>
                <h2 id={`${p.slug}-title`} className="mt-2 text-[2rem] font-semibold leading-tight text-green-950 sm:text-[2.5rem]">
                  {p.title}
                </h2>
                <div className="mt-6 space-y-6 text-[1.0625rem] leading-relaxed">
                  <div>
                    <h3 className="text-[1.25rem] font-semibold text-green-950">Overview</h3>
                    <p className="mt-1.5 text-slate">{p.summary}</p>
                  </div>
                  <div>
                    <h3 className="text-[1.25rem] font-semibold text-green-950">Who it is for</h3>
                    <p className="mt-1.5 text-slate">{p.audience}</p>
                  </div>
                  <div>
                    <h3 className="text-[1.25rem] font-semibold text-green-950">Career relevance</h3>
                    <p className="mt-1.5 text-slate">{p.relevance}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="border border-rule bg-white">
                  <div className="border-b border-rule p-6">
                    <h3 className="text-[1.25rem] font-semibold text-green-950">Admission requirements</h3>
                    <div className="mt-3 text-[1.0625rem]"><RequirementList programme={p} /></div>
                  </div>
                  <div className="border-b border-rule p-6">
                    <h3 className="text-[1.25rem] font-semibold text-green-950">Programme focus</h3>
                    <div className="mt-3"><FocusList items={p.focus} /></div>
                  </div>
                  <div className="grid gap-3 p-6 xs:grid-cols-2">
                    <ButtonLink to={applyPath(p)}>Apply</ButtonLink>
                    <ButtonLink to={p.path} variant="secondary">
                      Programme details
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        ))}
      </div>

      <CTASection />
    </>
  )
}
