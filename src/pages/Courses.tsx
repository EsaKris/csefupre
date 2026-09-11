import { useState } from 'react'
import { Link } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { images } from '../config/images'
import { courses, courseCategories, courseLabel, courseFee, type CourseCategory } from '../config/courses'
import { Fee } from '../components/ui/Fee'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { Tbd } from '../components/ui/Tbd'
import { ButtonLink } from '../components/ui/Button'

type Filter = 'All' | CourseCategory

export default function Courses() {
  usePageMeta({
    title: 'Short and professional courses',
    path: '/courses',
    description:
      'Short and professional safety courses at the Centre for Safety Education, FUPRE, including ISO 45001, ISO 14001, ISO 9001, H₂S Safety, Confined Space Entry, Defensive Driving and Incident Investigation.',
  })

  const [filter, setFilter] = useState<Filter>('All')
  const visible = filter === 'All' ? courses : courses.filter((c) => c.category === filter)
  const filters: Filter[] = ['All', ...courseCategories]

  return (
    <>
      <PageHeader
        title="Short and professional courses"
        crumbs={[{ label: 'Courses' }]}
        intro="Certification and training courses run alongside the degree programmes."
        image={images.coursesHeader}
      />

      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <h2 id="filter-heading" className="font-display text-lg font-semibold text-green-950">
                Filter by category
              </h2>
              <ul aria-labelledby="filter-heading" className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {filters.map((f) => {
                  const count = f === 'All' ? courses.length : courses.filter((c) => c.category === f).length
                  const active = filter === f
                  return (
                    <li key={f}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(f)}
                        className={`flex w-full items-baseline justify-between gap-3 border px-3.5 py-2 text-left text-[0.9375rem] lg:border-0 lg:border-l-4 ${
                          active
                            ? 'border-green-800 bg-green-50 font-semibold text-green-950 lg:border-l-gold'
                            : 'border-rule text-slate hover:bg-paper lg:border-l-transparent'
                        }`}
                      >
                        <span>{f}</span>
                        <span className="text-sm text-muted">{count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-8 hidden border-t border-rule pt-6 lg:block">
                <p className="text-[0.9375rem] leading-relaxed text-slate">
                  For group or organisational training enquiries, contact admissions.
                </p>
                <p className="mt-3">
                  <Link to="/contact?topic=Short%20courses" className="link text-[0.9375rem] font-semibold">
                    Send an enquiry
                  </Link>
                </p>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <p className="text-[0.9375rem] text-muted" aria-live="polite">
              Showing {visible.length} {visible.length === 1 ? 'course' : 'courses'}
              {filter === 'All' ? '' : ` in ${filter.toLowerCase()}`}
            </p>
            <ul className="mt-4 border-t-2 border-green-900">
              {visible.map((c) => (
                <li key={c.slug} id={c.slug} className="scroll-mt-24 border-b border-rule">
                  <article className="grid gap-4 py-8 md:grid-cols-[1fr_auto] md:gap-10">
                    <div>
                      <p className="text-sm font-semibold text-green-700">{c.category}</p>
                      <h3 className="mt-1 text-[1.75rem] font-semibold leading-tight text-green-950">{courseLabel(c)}</h3>
                      <p className="mt-3 max-w-[44rem] text-[1.0625rem] leading-relaxed text-ink">{c.about}</p>
                      <p className="mt-3 max-w-[44rem] text-[1.0625rem] leading-relaxed text-slate">
                        <span className="font-semibold text-ink">Relevant for: </span>
                        {c.relevance}
                      </p>
                      <p className="mt-4 text-[0.9375rem]">
                        {c.officialOutline ?? <Tbd>Course outline, duration, dates and certification to be confirmed by the Centre.</Tbd>}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 md:items-end md:pt-7">
                      <p className="md:text-right">
                        <span className="block text-sm text-muted">Course fee</span>
                        <Fee amount={courseFee(c)} className="md:justify-end" />
                      </p>
                      <ButtonLink
                        to={`/contact?topic=${encodeURIComponent('Short courses')}&course=${c.slug}`}
                        variant="secondary"
                        className="w-full whitespace-nowrap md:w-auto"
                      >
                        Enquire<span className="sr-only"> about {c.title}</span>
                      </ButtonLink>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </>
  )
}
