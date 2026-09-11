import { Link } from 'react-router'
import { site } from '../../config/site'
import { Container } from '../ui/Container'

export function TopBar() {
  return (
    <div className="bg-charcoal text-[0.8125rem] text-white/85 print:hidden">
      <Container className="flex min-h-9 items-center justify-between gap-4 py-1.5">
        <p className="truncate">
          <span className="hidden sm:inline">{site.institution.name}</span>
          <span className="sm:hidden">FUPRE, Effurun</span>
        </p>
        <ul className="flex shrink-0 items-center gap-5">
          <li className="hidden md:block">
            <a href={`mailto:${site.contact.email}`} className="hover:text-white hover:underline underline-offset-4">
              {site.contact.email}
            </a>
          </li>
          <li className="hidden md:block">
            <a href={`tel:${site.contact.phones[0].tel}`} className="hover:text-white hover:underline underline-offset-4">
              {site.contact.phones[0].display}
            </a>
          </li>
          <li>
            <Link to="/brochure" className="hover:text-white hover:underline underline-offset-4">
              Admission brochure
            </Link>
          </li>
        </ul>
      </Container>
    </div>
  )
}
