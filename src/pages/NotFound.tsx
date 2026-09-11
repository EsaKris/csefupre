import { Link } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { primaryNav } from '../config/navigation'

export default function NotFound() {
  usePageMeta({
    title: 'Page not found',
    path: '/404',
    index: false,
    description: 'The page you requested could not be found on the Centre for Safety Education website.',
  })

  return (
    <Container className="py-20 sm:py-28">
      <div className="max-w-[40rem]">
        <span className="section-rule" aria-hidden="true" />
        <p className="font-display text-lg font-semibold text-green-700">Error 404</p>
        <h1 className="mt-2 text-[2.5rem] font-semibold text-green-950 sm:text-[3.25rem]">This page could not be found</h1>
        <p className="mt-5 text-lg leading-relaxed text-slate">
          The address may be mistyped, or the page may have moved. Use one of the links below to find what you need.
        </p>
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <ButtonLink to="/">Go to the homepage</ButtonLink>
          <ButtonLink to="/contact" variant="secondary">
            Contact admissions
          </ButtonLink>
        </div>
        <nav aria-label="Popular pages" className="mt-12 border-t border-rule pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {primaryNav.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="link">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Container>
  )
}
