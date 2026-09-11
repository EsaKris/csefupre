import { Link } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { images } from '../config/images'
import { careers, CAREERS_NOTICE } from '../config/careers'
import { homeCopy } from '../config/home'
import { programmes, displayName, formatDuration } from '../config/programmes'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Notice } from '../components/ui/Notice'
import { CTASection } from '../components/ui/CTASection'

export default function Careers() {
  usePageMeta({
    title: 'Career opportunities',
    path: '/careers',
    description:
      'Career paths in health, safety, environment and security — including HSE Manager, Safety Auditor and Environmental Consultant — and how study at the Centre for Safety Education supports professional development.',
  })

  const support = homeCopy.whyChoose.filter((w) =>
    ['Industry-relevant curriculum', 'Practical safety training', 'Career development', 'ISPON partnership'].includes(w.title),
  )

  return (
    <>
      <PageHeader
        title="Career opportunities"
        crumbs={[{ label: 'Careers' }]}
        intro="Health, safety, environment and security roles in which CSE training is relevant."
        image={images.careersHeader}
      />

      <section aria-labelledby="roles-heading" className="py-14 sm:py-16">
        <Container>
          <SectionHeading id="roles-heading" title="Career paths" />
          <Notice tone="info" className="mt-6 max-w-[48rem]">
            {CAREERS_NOTICE}
          </Notice>
          <ul className="mt-10 grid gap-x-12 md:grid-cols-2">
            {careers.map((c) => (
              <li key={c.title} className="border-t border-rule-strong py-7">
                <h3 className="flex items-center gap-3 text-[1.625rem] font-semibold text-green-950">
                  <span className="h-3 w-3 shrink-0 bg-gold" aria-hidden="true" />
                  {c.title}
                </h3>
                <p className="mt-2 max-w-[36rem] text-[1.0625rem] leading-relaxed text-slate">{c.description}</p>
                {c.note ? <p className="mt-2 text-[0.9375rem] text-muted">{c.note}</p> : null}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="support-heading" className="bg-paper py-14 sm:py-16">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              id="support-heading"
              title="How CSE training supports your development"
              intro="The Centre develops competent professionals for employment and leadership across the safety industry."
            />
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
            {support.map((s) => (
              <li key={s.title} className="border-t-2 border-green-900 pt-4">
                <h3 className="text-[1.375rem] font-semibold text-green-950">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate">{s.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="route-heading" className="py-14 sm:py-16">
        <Container>
          <SectionHeading
            id="route-heading"
            title="Choose your level of study"
            intro="Enter at the level that matches your current qualification."
          />
          <ol className="mt-10 grid border-t-2 border-green-900 md:grid-cols-4">
            {programmes.map((p) => (
              <li key={p.slug} className="border-b border-rule py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0">
                <p className="font-display text-sm font-semibold text-green-700">
                  Level {p.level} <span className="font-normal text-muted">/ {formatDuration(p)}</span>
                </p>
                <h3 className="mt-1 text-[1.375rem] font-semibold leading-tight text-green-950">
                  <Link to={p.path} className="hover:underline">
                    {displayName(p)}
                  </Link>
                </h3>
                <p className="mt-2 text-[0.9375rem] text-slate">Entry: {p.entryShort}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <CTASection />
    </>
  )
}
