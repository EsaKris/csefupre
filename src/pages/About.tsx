import { usePageMeta } from '../lib/seo'
import { aboutCopy } from '../config/about'
import { homeCopy } from '../config/home'
import { images, logos } from '../config/images'
import { site } from '../config/site'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Tbd } from '../components/ui/Tbd'
import { LogoMark } from '../components/ui/LogoMark'
import { ButtonLink } from '../components/ui/Button'
import { CTASection } from '../components/ui/CTASection'

function Statement({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="border-t-4 border-green-800 bg-white p-7 sm:p-9">
      <h3 className="text-[1.75rem] font-semibold text-green-950">{title}</h3>
      <p className="mt-4 text-[1.1875rem] leading-[1.65] text-ink">
        {value ?? <Tbd>Official {title.toLowerCase()} statement to be supplied by the Centre.</Tbd>}
      </p>
    </div>
  )
}

/** Mission renders as a list of distinct statements, matching how Objectives is presented below. */
function StatementList({ title, values }: { title: string; values: string[] | null }) {
  return (
    <div className="border-t-4 border-green-800 bg-white p-7 sm:p-9">
      <h3 className="text-[1.75rem] font-semibold text-green-950">{title}</h3>
      {values ? (
        <ul className="mt-4 space-y-3">
          {values.map((v) => (
            <li key={v} className="flex gap-3 text-[1.0625rem] leading-[1.6] text-ink">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-green-700" aria-hidden="true" />
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[1.1875rem] leading-[1.65] text-ink">
          <Tbd>Official {title.toLowerCase()} statement to be supplied by the Centre.</Tbd>
        </p>
      )}
    </div>
  )
}

export default function About() {
  usePageMeta({
    title: 'About the Centre',
    path: '/about',
    description:
      'About the Centre for Safety Education at the Federal University of Petroleum Resources, Effurun — its purpose, areas of specialization, practical training and partnership with ISPON.',
  })

  const c = aboutCopy

  return (
    <>
      <PageHeader
        title="About the Centre for Safety Education"
        crumbs={[{ label: 'About' }]}
        intro="Developing competent professionals for employment and leadership across the safety industry."
        image={images.aboutHeader}
      />

      {/* About CSE + About FUPRE */}
      <section aria-labelledby="about-cse" className="py-16 sm:py-20">
        <Container className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading id="about-cse" title="The Centre" />
            <div className="prose-body mt-6 max-w-[40rem] text-lg leading-[1.7] text-slate">
              {c.cse.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <aside aria-labelledby="about-fupre" className="lg:col-span-5">
            <div className="border border-rule bg-paper p-7">
              <div className="flex items-center gap-4">
                <LogoMark logo={logos.fupre} placeholderText="FUPRE" className="h-16 w-16" />
                <h2 id="about-fupre" className="text-[1.625rem] font-semibold leading-tight text-green-950">
                  {site.institution.name}
                </h2>
              </div>
              <p className="mt-5 leading-relaxed text-ink">
                {c.fupreDescription ?? (
                  <Tbd>Official description of the University to be supplied by FUPRE.</Tbd>
                )}
              </p>
              {c.motto ? (
                <p className="mt-5 border-l-4 border-gold pl-4 font-display text-xl font-semibold italic text-green-900">
                  “{c.motto.replace(/\.$/, '')}”
                </p>
              ) : null}
              <p className="mt-5">
                <a href={site.contact.website.href} target="_blank" rel="noopener noreferrer" className="link font-semibold">
                  Centre page on the FUPRE website
                </a>
              </p>
            </div>
          </aside>
        </Container>
      </section>

      {/* Vision and mission */}
      <section aria-labelledby="vision-mission" className="bg-paper py-16 sm:py-20">
        <Container>
          <h2 id="vision-mission" className="sr-only">
            Vision and mission
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Statement title="Vision" value={c.vision} />
            <StatementList title="Mission" values={c.mission} />
          </div>
        </Container>
      </section>

      {/* Objectives */}
      <section aria-labelledby="objectives" className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="objectives" title="Objectives" />
          </div>
          <div className="lg:col-span-8">
            {c.objectives ? (
              <ol className="divide-y divide-rule border-y border-rule">
                {c.objectives.map((o, i) => (
                  <li key={o} className="flex gap-5 py-5 text-[1.0625rem] leading-relaxed">
                    <span className="font-display text-xl font-semibold text-green-700">{i + 1}</span>
                    {o}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="border-y border-rule py-6 text-lg">
                <Tbd>The Centre's official objectives to be supplied.</Tbd>
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* Areas of specialization */}
      <section aria-labelledby="specialization" className="bg-charcoal py-16 text-white sm:py-20">
        <Container>
          <SectionHeading id="specialization" tone="dark" title="Areas of specialization" />
          <ul className="mt-10 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-5">
            {homeCopy.focusAreas.map((a) => (
              <li key={a} className="bg-charcoal py-6 pr-6 font-display text-[1.5rem] font-semibold leading-tight sm:p-6">
                <span className="mb-4 block h-3 w-3 bg-gold" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Industry relevance, practical training, professional development */}
      <section aria-labelledby="approach" className="py-16 sm:py-20">
        <Container>
          <SectionHeading id="approach" title="How the Centre teaches" />
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              { title: 'Industry relevance', text: c.industryRelevance },
              { title: 'Practical training', text: c.practicalTraining },
              { title: 'Professional development', text: c.professionalDevelopment },
            ].map((b) => (
              <div key={b.title} className="border-t-2 border-green-900 pt-5">
                <h3 className="text-[1.5rem] font-semibold text-green-950">{b.title}</h3>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate">{b.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 xs:flex-row">
            <ButtonLink to="/programmes">View programmes</ButtonLink>
            <ButtonLink to="/courses" variant="secondary">
              View short courses
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Partnership */}
      <section aria-labelledby="partnership" className="border-t border-rule bg-paper py-16 sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading id="partnership" title="Partnership" intro={homeCopy.partnership.text} />
          </div>
          <div className="flex items-center gap-4 xs:gap-6 lg:col-span-5 lg:justify-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-rule bg-white p-3 xs:h-32 xs:w-32">
              <LogoMark logo={logos.fupre} placeholderText="FUPRE" className="h-full w-full" />
            </div>
            <span className="font-display text-3xl text-muted" aria-hidden="true">
              ×
            </span>
            <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-rule bg-white p-3 xs:h-32 xs:w-32">
              <LogoMark logo={logos.ispon} placeholderText="ISPON" className="h-full w-full" />
            </div>
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  )
}
