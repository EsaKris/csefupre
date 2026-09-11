import { Link } from 'react-router'
import { site } from '../../config/site'
import { logos } from '../../config/images'
import { footerQuickLinks, footerResourceLinks, legalLinks } from '../../config/navigation'
import { Container } from '../ui/Container'
import { LogoMark } from '../ui/LogoMark'

function FooterList({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-green-100 underline-offset-4 hover:text-white hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t-4 border-gold bg-green-950 text-green-100 print:hidden">
      <Container className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark logo={logos.fupre} placeholderText="FUPRE" tone="dark" className="h-16 w-16" />
            <LogoMark logo={logos.ispon} placeholderText="ISPON" tone="dark" className="h-16 w-16" />
          </div>
          <p className="mt-5 font-display text-2xl font-semibold leading-tight text-white">{site.centre.name}</p>
          <p className="mt-1 text-[0.9375rem]">{site.institution.name}</p>
        </div>

        <FooterList title="Quick links" links={footerQuickLinks} />

        <div className="space-y-10">
          <FooterList title="Resources" links={footerResourceLinks} />
          <FooterList title="Legal" links={legalLinks} />
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-white">Contact admissions</h2>
          <address className="mt-4 space-y-3 not-italic">
            <p>
              <a href={`mailto:${site.contact.email}`} className="text-white underline-offset-4 hover:underline">
                {site.contact.email}
              </a>
            </p>
            <p>
              {site.contact.phones.map((p) => (
                <span key={p.tel} className="block">
                  <a href={`tel:${p.tel}`} className="underline-offset-4 hover:text-white hover:underline">
                    {p.display}
                  </a>
                </span>
              ))}
            </p>
            <p>
              {site.contact.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </address>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 text-sm text-green-100/80 sm:flex-row sm:items-center sm:justify-between">
          <p>{site.copyright}</p>
          <p>
            <a href={site.contact.website.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-white hover:underline">
              {site.contact.website.display}
            </a>
          </p>
        </Container>
      </div>
    </footer>
  )
}
