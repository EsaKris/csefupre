import { usePageMeta } from '../lib/seo'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import type { Crumb } from '../components/ui/Breadcrumbs'

/**
 * TEMPORARY — review builds only.
 * Keeps every route navigable while later phases are built.
 * Each usage is replaced by a real page; delete this file before launch.
 */
export function PendingPage({ title, path, crumbs, phase }: { title: string; path: string; crumbs: Crumb[]; phase: number }) {
  usePageMeta({ title, path, index: false, description: `${title} — Centre for Safety Education, FUPRE.` })
  return (
    <>
      <PageHeader title={title} crumbs={crumbs} />
      <Container className="py-16">
        <div className="max-w-[40rem] border-l-4 border-gold bg-caution-bg px-6 py-5">
          <p className="font-display text-xl font-semibold text-ink">Page scheduled for Phase {phase}</p>
          <p className="mt-2 text-slate">This route is registered so navigation can be reviewed. Its content is built in a later phase.</p>
        </div>
        <div className="mt-8">
          <ButtonLink to="/" variant="secondary">
            Back to homepage
          </ButtonLink>
        </div>
      </Container>
    </>
  )
}
