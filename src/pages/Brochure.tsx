import { Download, FileText, Printer } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { site } from '../config/site'
import { programmes, displayName, formatDuration, REQUIREMENTS_NOTICE } from '../config/programmes'
import { courses, courseLabel, courseFee } from '../config/courses'
import { Fee } from '../components/ui/Fee'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { ButtonAnchor, ButtonLink } from '../components/ui/Button'
import { RequirementList } from '../components/content/RequirementCard'

export default function Brochure() {
  usePageMeta({
    title: 'Admission brochure',
    path: '/brochure',
    description:
      'Download the admission brochure for the Centre for Safety Education, FUPRE, or view a printable summary of programmes, durations and entry requirements.',
  })

  const hasBrochure = Boolean(site.brochureUrl)

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Admission brochure"
          crumbs={[{ label: 'Brochure' }]}
          intro="Programme and admission information from the Centre for Safety Education."
          compact
        />
      </div>

      <Container className="py-14 sm:py-16">
        <section aria-labelledby="download-heading" className="grid gap-8 border border-rule bg-paper p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center print:hidden">
          {/* Brochure cover slot */}
          <div className="mx-auto flex aspect-[3/4] w-40 flex-col justify-between border border-rule-strong bg-green-900 p-4 text-white shadow-[8px_8px_0_0_var(--color-rule)] sm:w-48">
            <FileText aria-hidden="true" className="h-6 w-6 text-gold-soft" />
            <div>
              <p className="font-display text-sm text-gold-soft">FUPRE</p>
              <p className="font-display text-lg font-semibold leading-tight">Centre for Safety Education</p>
              <p className="mt-2 text-xs text-green-100">Admission brochure</p>
            </div>
          </div>

          <div>
            <h2 id="download-heading" className="text-[2rem] font-semibold text-green-950">
              {hasBrochure ? 'Download the admission brochure' : 'Official brochure coming soon'}
            </h2>
            {hasBrochure ? (
              <>
                <p className="mt-3 max-w-[36rem] text-[1.0625rem] leading-relaxed text-slate">
                  The official brochure is a PDF document. It opens in your browser, where you can save or print it.
                </p>
                <div className="mt-6 flex flex-col gap-3 xs:flex-row">
                  <ButtonAnchor href={site.brochureUrl}>
                    <Download aria-hidden="true" className="h-5 w-5" />
                    Download brochure (PDF)
                  </ButtonAnchor>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 max-w-[36rem] text-[1.0625rem] leading-relaxed text-slate">
                  The Centre's official admission brochure will be available to download from this page. In the meantime, the
                  summary below lists every programme, its duration and its entry requirement. You can print it or save it as a PDF.
                </p>
                <div className="mt-6 flex flex-col gap-3 xs:flex-row">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-green-800 px-5 font-display text-[1.0625rem] font-semibold text-white hover:bg-green-950"
                  >
                    <Printer aria-hidden="true" className="h-5 w-5" />
                    Print programme summary
                  </button>
                  <ButtonLink to="/contact" variant="secondary">
                    Request information
                  </ButtonLink>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Printable summary — derived from site configuration, not the official brochure */}
        <section aria-labelledby="summary-heading" className="mt-14 print:mt-0">
          <div className="border-b-2 border-green-900 pb-4">
            <p className="font-display text-lg font-semibold text-green-700">{site.institution.name}</p>
            <h2 id="summary-heading" className="mt-1 text-[2rem] font-semibold text-green-950">
              {site.centre.name}: programme summary
            </h2>
          </div>

          <table className="mt-6 w-full border-collapse text-left text-[1rem] max-sm:block">
            <caption className="sr-only">Programmes, durations and entry requirements</caption>
            <thead className="max-sm:hidden">
              <tr className="border-b border-rule-strong text-sm text-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">Programme</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Duration</th>
                <th scope="col" className="py-2 font-semibold">Entry requirement</th>
              </tr>
            </thead>
            <tbody className="max-sm:block">
              {programmes.map((p) => (
                <tr key={p.slug} className="border-b border-rule align-top max-sm:block max-sm:py-3">
                  <th scope="row" className="py-4 pr-4 max-sm:block max-sm:py-1">
                    <span className="font-display text-lg font-semibold text-green-950">{displayName(p)}</span>
                    <span className="block text-sm font-normal text-muted">in {p.field}</span>
                  </th>
                  <td className="py-4 pr-4 whitespace-nowrap max-sm:block max-sm:py-1"><span className="sm:hidden text-muted">Duration: </span>{formatDuration(p)}</td>
                  <td className="py-4 max-sm:block max-sm:py-1">
                    <RequirementList programme={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[0.9375rem] text-slate">{REQUIREMENTS_NOTICE}</p>

          <h3 className="mt-10 text-[1.5rem] font-semibold text-green-950">Short and professional courses</h3>
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
            {courses.map((c) => (
              <li key={c.slug} className="flex justify-between gap-4 border-b border-rule py-2">
                <span>{courseLabel(c)}</span>
                <Fee amount={courseFee(c)} size="sm" className="shrink-0 justify-end" />
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t-2 border-green-900 pt-4 text-[0.9375rem]">
            <p className="font-semibold">Contact admissions</p>
            <p>
              {site.contact.email} &nbsp;|&nbsp; {site.contact.phones.map((p) => p.display).join(', ')}
            </p>
            <p>{site.contact.address.join(', ')}</p>
            <p>{site.contact.website.display}</p>
          </div>
        </section>
      </Container>
    </>
  )
}
