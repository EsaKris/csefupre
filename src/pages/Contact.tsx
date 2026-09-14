import { Mail, MapPin, Phone, Globe } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { site } from '../config/site'
import { images } from '../config/images'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { ButtonAnchor } from '../components/ui/Button'
import { EnquiryForm } from '../components/forms/EnquiryForm'

const schoolQuery = 'Federal University of Petroleum Resources, Effurun'
const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolQuery)}`
// No-API-key embed — works out of the box. If you later get a Google Maps
// embed API key and set `contact.mapEmbedUrl` in site config, that takes priority.
const defaultMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(schoolQuery)}&output=embed`

function ContactCard({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-rule py-5 last:border-b-0">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-green-950">
        <Icon aria-hidden="true" className="h-5 w-5 text-green-700" strokeWidth={1.75} />
        {title}
      </h3>
      <div className="mt-1.5 pl-7 text-[1.0625rem] leading-relaxed">{children}</div>
    </div>
  )
}

export default function Contact() {
  usePageMeta({
    title: 'Contact admissions',
    path: '/contact',
    description:
      'Contact the Centre for Safety Education, FUPRE: cse@fupre.edu.ng, 0802 848 7246, 0703 594 1999. Old TETFund Building, Federal University of Petroleum Resources.',
  })

  const { contact } = site
  const mapEmbedUrl = contact.mapEmbedUrl || defaultMapEmbedUrl

  return (
    <>
      <PageHeader
        title="Contact admissions"
        crumbs={[{ label: 'Contact' }]}
        intro="Questions about programmes, requirements, courses or an application you have submitted."
        image={images.contactHeader}
      >
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <ButtonAnchor href={`mailto:${contact.email}`} variant="onDark">
            Email admissions
          </ButtonAnchor>
          <ButtonAnchor href={`tel:${contact.phones[0].tel}`} variant="onDarkOutline">
            Call {contact.phones[0].display}
          </ButtonAnchor>
        </div>
      </PageHeader>

      <Container className="grid gap-14 py-14 sm:py-16 lg:grid-cols-12">
        <section aria-labelledby="details-heading" className="lg:col-span-5">
          <h2 id="details-heading" className="text-[2rem] font-semibold text-green-950">
            Contact information
          </h2>
          <address className="mt-4 not-italic">
            <ContactCard icon={Mail} title="Email">
              <a href={`mailto:${contact.email}`} className="link">
                {contact.email}
              </a>
            </ContactCard>
            <ContactCard icon={Phone} title="Telephone">
              {contact.phones.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`} className="link block">
                  {p.display}
                </a>
              ))}
            </ContactCard>
            <ContactCard icon={MapPin} title="Address">
              {contact.address.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </ContactCard>
            <ContactCard icon={Globe} title="Website">
              <a href={contact.website.href} target="_blank" rel="noopener noreferrer" className="link break-words">
                {contact.website.display}
              </a>
            </ContactCard>
          </address>

          <div className="mt-8">
            <h3 className="sr-only">Map</h3>
            <iframe
              title="Map showing the Centre for Safety Education, FUPRE"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full border border-rule"
            />
            
            <a
              href={mapsSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="link mt-2 inline-block text-sm font-semibold"
            >
              Open in Google Maps
            </a>
          </div>
        </section>

        <section aria-labelledby="enquiry-heading" className="lg:col-span-7">
          <div className="border border-rule border-t-4 border-t-green-800 bg-white p-6 sm:p-8">
            <h2 id="enquiry-heading" className="text-[2rem] font-semibold text-green-950">
              Send an enquiry
            </h2>
            <p className="mt-2 text-slate">All fields are required unless marked optional.</p>
            <div className="mt-8">
              <EnquiryForm />
            </div>
          </div>
        </section>
      </Container>
    </>
  )
}