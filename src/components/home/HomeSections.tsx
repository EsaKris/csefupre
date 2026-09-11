import { Link } from 'react-router'
import { Check, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { homeCopy } from '../../config/home'
import { images, logos } from '../../config/images'
import { programmes, formatDuration, REQUIREMENTS_NOTICE } from '../../config/programmes'
import { courses, courseLabel } from '../../config/courses'
import { careerPaths, CAREERS_NOTICE } from '../../config/careers'
import { site } from '../../config/site'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ButtonAnchor, ButtonLink } from '../ui/Button'
import { ImageFrame } from '../ui/ImageFrame'
import { LogoMark } from '../ui/LogoMark'

/* 2 — Introduction to the Centre */
export function AboutIntro() {
  const { about } = homeCopy
  return (
    <section aria-labelledby="about-heading" className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeading id="about-heading" title={about.heading} />
          <div className="prose-body mt-6 max-w-[38rem] text-lg leading-[1.7] text-slate">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-8">
            <Link to="/about" className="link text-lg font-semibold">
              About the Centre and FUPRE
            </Link>
          </p>
        </div>
        <div className="lg:col-span-6">
          <div className="aspect-[3/2] w-full">
            <ImageFrame image={images.homeAbout} sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* 3 — Programmes overview */
export function ProgrammesOverview() {
  return (
    <section aria-labelledby="programmes-heading" className="bg-paper py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="programmes-heading"
            title="Programmes offered"
            intro="Four programmes in Health, Environment, Safety and Security, from professional diploma to doctorate."
          />
          <ButtonLink to="/programmes" variant="secondary" className="self-start md:self-auto">
            Compare programmes
          </ButtonLink>
        </div>

        <div className="mt-12 border-t-2 border-green-900 bg-white">
          {/* Column labels for wide screens */}
          <div className="hidden grid-cols-[1.3fr_0.7fr_2fr_auto] gap-8 border-b border-rule px-6 py-3 text-sm font-semibold text-muted lg:grid" aria-hidden="true">
            <span>Programme</span>
            <span>Duration</span>
            <span>Overview</span>
            <span className="w-40" />
          </div>
          <ul>
            {programmes.map((p) => (
              <li key={p.slug} className="border-b border-rule last:border-b-0">
                <article className="grid gap-3 px-5 py-7 sm:px-6 lg:grid-cols-[1.3fr_0.7fr_2fr_auto] lg:items-baseline lg:gap-8">
                  <h3 className="font-display text-[1.625rem] font-semibold leading-tight text-green-950">
                    <Link to={p.path} className="hover:underline hover:decoration-2 hover:underline-offset-4">
                      {p.shortTitle}
                    </Link>
                    <span className="mt-1 block font-sans text-[0.9375rem] font-normal text-muted">in {p.field}</span>
                  </h3>
                  <p className="font-display text-xl font-semibold text-green-700">
                    <span className="sr-only">Duration: </span>
                    {formatDuration(p)}
                  </p>
                  <p className="max-w-[46ch] leading-relaxed text-slate">{p.summary}</p>
                  <p className="lg:w-40 lg:text-right">
                    <Link to={p.path} className="link font-semibold">
                      View requirements<span className="sr-only"> for {p.shortTitle}</span>
                    </Link>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

/* 4 — Why choose FUPRE CSE */
export function WhyChoose() {
  return (
    <section aria-labelledby="why-heading" className="py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading id="why-heading" title="Why choose FUPRE CSE?" />
        </div>
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
          {homeCopy.whyChoose.map((item) => (
            <li key={item.title} className="border-t border-rule-strong pt-5">
              <div className="flex gap-4">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center bg-green-800 text-white" aria-hidden="true">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div>
                  <h3 className="font-display text-[1.375rem] font-semibold text-green-950">{item.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-slate">{item.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

/* 5 — Practical and industry training, with short courses */
export function PracticalTraining() {
  const { practical } = homeCopy
  return (
    <section aria-labelledby="practical-heading" className="bg-green-50 py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="aspect-[4/5] w-full max-lg:aspect-[3/2]">
            <ImageFrame image={images.homePractical} sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <SectionHeading id="practical-heading" title={practical.heading} intro={practical.text} />

          <div className="mt-10 border-t-2 border-green-900 pt-6">
            <h3 className="font-display text-[1.5rem] font-semibold text-green-950">Short and professional courses</h3>
            <p className="mt-2 text-slate">{practical.coursesIntro}</p>
            <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
              {courses.map((c) => (
                <li key={c.slug} className="border-b border-rule py-2.5 text-[1.0625rem] text-ink">
                  {courseLabel(c)}
                </li>
              ))}
            </ul>
            <p className="mt-8">
              <ButtonLink to="/courses" variant="secondary">
                View all courses
              </ButtonLink>
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* 6 — Health, Safety, Environment & Security areas */
export function FocusAreas() {
  return (
    <section aria-labelledby="areas-heading" className="bg-charcoal py-16 text-white sm:py-20">
      <Container>
        <SectionHeading
          id="areas-heading"
          tone="dark"
          title="Areas of focus"
          intro="The Centre's programmes span these areas of Health, Safety, Environment and Security practice."
        />
        <ul className="mt-10 grid border-t border-white/20 sm:grid-cols-2 lg:grid-cols-5">
          {homeCopy.focusAreas.map((area) => (
            <li
              key={area}
              className="border-b border-white/20 py-6 font-display text-[1.5rem] font-semibold leading-tight sm:pr-6 lg:border-b-0 lg:border-r lg:py-8 lg:pl-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <span className="mb-4 block h-3 w-3 bg-gold" aria-hidden="true" />
              {area}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

/* 7 — Career opportunities */
export function CareersPreview() {
  return (
    <section aria-labelledby="careers-heading" className="py-20 sm:py-24">
      <Container className="grid items-start gap-12 lg:grid-cols-12">
        <div className="order-2 lg:col-span-5">
          <div className="aspect-[4/5] w-full max-lg:aspect-[3/2]">
            <ImageFrame image={images.homeCareers} sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
        </div>
        <div className="order-1 lg:col-span-7">
          <SectionHeading id="careers-heading" title="Career opportunities" intro="Roles in which CSE training is relevant." />
          <ul className="mt-8 grid gap-x-8 sm:grid-cols-2">
            {careerPaths.map((role) => (
              <li key={role} className="flex items-center gap-3 border-b border-rule py-3.5 font-display text-[1.25rem] font-medium text-green-950">
                <span className="h-2.5 w-2.5 shrink-0 bg-green-700" aria-hidden="true" />
                {role}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[40rem] text-[0.9375rem] leading-relaxed text-muted">{CAREERS_NOTICE}</p>
          <p className="mt-8">
            <ButtonLink to="/careers" variant="secondary">
              Explore career paths
            </ButtonLink>
          </p>
        </div>
      </Container>
    </section>
  )
}

/* 8 — Partnership */
export function Partnership() {
  const { partnership } = homeCopy
  return (
    <section aria-labelledby="partnership-heading" className="border-y border-rule bg-paper py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-12">
        <div className="flex items-center gap-6 lg:col-span-5">
          <div className="flex h-28 w-28 items-center justify-center border border-rule bg-white p-3 sm:h-32 sm:w-32">
            <LogoMark logo={logos.fupre} placeholderText="FUPRE" className="h-full w-full" />
          </div>
          <span className="font-display text-3xl text-muted" aria-hidden="true">
            ×
          </span>
          <div className="flex h-28 w-28 items-center justify-center border border-rule bg-white p-3 sm:h-32 sm:w-32">
            <LogoMark logo={logos.ispon} placeholderText="ISPON" className="h-full w-full" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <SectionHeading id="partnership-heading" title={partnership.heading} intro={partnership.text} />
        </div>
      </Container>
    </section>
  )
}

/* 9 — Admission requirements summary */
export function RequirementsSummary() {
  return (
    <section aria-labelledby="requirements-heading" className="py-20 sm:py-24">
      <Container>
        <SectionHeading id="requirements-heading" title="What you need to apply" />
        <dl className="mt-10 border-t-2 border-green-900">
          {programmes.map((p) => (
            <div key={p.slug} className="grid gap-2 border-b border-rule py-6 md:grid-cols-[18rem_1fr] md:items-baseline md:gap-10">
              <dt className="font-display text-[1.375rem] font-semibold text-green-950">
                {p.shortTitle}
                {p.abbreviation && p.abbreviation !== 'Ph.D.' ? ` (${p.abbreviation})` : ''}
              </dt>
              <dd className="text-[1.0625rem] leading-relaxed text-ink">
                {p.requirements.alternatives ? (
                  <ul className="space-y-1">
                    {p.requirements.items.map((req, i) => (
                      <li key={req}>
                        {i > 0 ? <span className="mr-2 font-semibold text-green-700">or</span> : null}
                        {req}
                      </li>
                    ))}
                  </ul>
                ) : (
                  p.requirements.items[0]
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[44rem] border-l-4 border-gold bg-caution-bg px-5 py-4 text-[0.9375rem] leading-relaxed text-ink">
            {REQUIREMENTS_NOTICE}
          </p>
          <ButtonLink to="/admissions" variant="secondary" className="shrink-0">
            Admissions information
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}

/* 10 — Application call to action */
export function ApplyCta() {
  const { closingCta } = homeCopy
  return (
    <section aria-labelledby="apply-cta-heading" className="bg-green-900 py-16 text-white sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <h2 id="apply-cta-heading" className="text-[2.25rem] font-semibold leading-[1.05] sm:text-[3rem]">
            {closingCta.heading}
          </h2>
          {site.admissions.applicationsOpen ? (
            <p className="mt-5 text-lg text-green-100">{closingCta.openText}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 lg:col-span-6 xl:col-span-5 xl:col-start-8">
          <ButtonLink to="/apply" variant="onDark">
            Apply Today
          </ButtonLink>
          <div className="grid gap-3 xs:grid-cols-2">
            <ButtonLink to="/contact" variant="onDarkOutline">
              Request More Information
            </ButtonLink>
            <ButtonAnchor href={`mailto:${site.contact.email}`} variant="onDarkOutline">
              Contact Admissions
            </ButtonAnchor>
          </div>
          <p className="mt-2 text-[0.9375rem] text-green-100">
            Already applied?{' '}
            <Link to="/payment" className="text-white underline underline-offset-4">
              Continue an incomplete payment
            </Link>
          </p>
        </div>
      </Container>
    </section>
  )
}

/* 11 — Contact */
export function ContactSection() {
  const { contact } = site
  const blocks = [
    {
      icon: Mail,
      label: 'Email',
      body: (
        <a href={`mailto:${contact.email}`} className="link">
          {contact.email}
        </a>
      ),
    },
    {
      icon: Phone,
      label: 'Telephone',
      body: (
        <span className="flex flex-col">
          {contact.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`} className="link">
              {p.display}
            </a>
          ))}
        </span>
      ),
    },
    {
      icon: MapPin,
      label: 'Address',
      body: (
        <span className="flex flex-col">
          {contact.address.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      ),
    },
    {
      icon: Globe,
      label: 'Website',
      body: (
        <a href={contact.website.href} target="_blank" rel="noopener noreferrer" className="link break-words">
          {contact.website.display}
        </a>
      ),
    },
  ]

  return (
    <section aria-labelledby="contact-heading" className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading id="contact-heading" title="Contact admissions" intro="For further enquiries about programmes, requirements or your application." />
          <div className="flex flex-col gap-3 xs:flex-row">
            <ButtonAnchor href={`mailto:${contact.email}`}>Email admissions</ButtonAnchor>
            <ButtonAnchor href={`tel:${contact.phones[0].tel}`} variant="secondary">
              Call {contact.phones[0].display}
            </ButtonAnchor>
          </div>
        </div>
        <address className="mt-12 grid border-t-2 border-green-900 not-italic sm:grid-cols-2 lg:grid-cols-4">
          {blocks.map(({ icon: Icon, label, body }) => (
            <div key={label} className="border-b border-rule py-6 sm:pr-6 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-green-950">
                <Icon aria-hidden="true" className="h-5 w-5 text-green-700" strokeWidth={1.75} />
                {label}
              </p>
              <div className="mt-2 text-[1.0625rem] leading-relaxed text-ink">{body}</div>
            </div>
          ))}
        </address>
      </Container>
    </section>
  )
}
