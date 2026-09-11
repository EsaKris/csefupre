import { usePageMeta } from '../lib/seo'
import { programmes, REQUIREMENTS_NOTICE } from '../config/programmes'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { Notice } from '../components/ui/Notice'
import { CTASection } from '../components/ui/CTASection'
import { RequirementCard } from '../components/content/RequirementCard'
import { EligibilityChecker } from '../components/content/EligibilityChecker'

export default function Requirements() {
  usePageMeta({
    title: 'Admission requirements',
    path: '/requirements',
    description:
      "Entry requirements for the Professional Diploma, PGD, Master's and Ph.D. programmes at the Centre for Safety Education, FUPRE.",
  })

  return (
    <>
      <PageHeader
        title="Admission requirements"
        crumbs={[{ label: 'Admissions', to: '/admissions' }, { label: 'Requirements' }]}
        intro="Minimum entry requirements for each programme."
      />
      <Container className="py-14 sm:py-16">
        <Notice tone="caution" className="max-w-[48rem]">
          {REQUIREMENTS_NOTICE}
        </Notice>

        <h2 className="sr-only">Requirements by programme</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {programmes.map((p) => (
            <li key={p.slug}>
              <RequirementCard programme={p} />
            </li>
          ))}
        </ul>

        <div className="mt-14 max-w-[48rem]">
          <EligibilityChecker />
        </div>
      </Container>
      <CTASection />
    </>
  )
}
