import { Link } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { programmes, REQUIREMENTS_NOTICE } from '../config/programmes'
import { site } from '../config/site'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ButtonLink } from '../components/ui/Button'
import { Notice } from '../components/ui/Notice'
import { Tbd } from '../components/ui/Tbd'
import { Fee } from '../components/ui/Fee'
import { APPLICATION_FEES } from '../../shared/fees'
import { CTASection } from '../components/ui/CTASection'
import { RequirementCard } from '../components/content/RequirementCard'

const steps = [
  {
    title: 'Check the admission requirements',
    body: (
      <>
        Confirm that your qualification meets the requirement for your chosen programme.{' '}
        <Link to="/requirements" className="link">
          Use the requirements guide
        </Link>
        .
      </>
    ),
  },
  {
    title: 'Complete the online application form',
    body: 'The form has five sections: personal details, programme, education, professional background, and a final review of everything you entered.',
  },
  {
    title: 'Submit and receive your Application ID',
    body: 'Your application is saved as soon as you submit. Keep your Application ID — you need it, with your email address, to continue a payment or to ask about your application.',
  },
  {
    title: 'Pay the application fee',
    body: "Payment is completed on Paystack's secure checkout. If payment does not go through, your application stays saved and you can continue the payment later.",
  },
  {
    title: 'Receive confirmation',
    body: 'Once payment is verified, a confirmation page shows your Application ID and payment reference, which you can print or save. Admissions will use the contact details you provide for further communication.',
  },
]

export default function Admissions() {
  usePageMeta({
    title: 'Admissions',
    path: '/admissions',
    description:
      'How to apply to the Centre for Safety Education, FUPRE: admission requirements, the online application process, application payment and how to contact admissions.',
  })

  return (
    <>
      <PageHeader
        title="Admissions"
        crumbs={[{ label: 'Admissions' }]}
        intro="Requirements, how to apply, and what happens after you submit your application."
      >
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <ButtonLink to="/apply" variant="onDark">
            Start your application
          </ButtonLink>
          <ButtonLink to="/payment" variant="onDarkOutline">
            Continue a payment
          </ButtonLink>
        </div>
      </PageHeader>

      {/* How to apply — a genuine sequence */}
      <section aria-labelledby="how-to-apply" className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="how-to-apply" title="How to apply" intro="Five steps from checking your eligibility to confirmation." />
          </div>
          <ol className="lg:col-span-8">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 pb-10 last:pb-0">
                {i < steps.length - 1 ? (
                  <span className="absolute bottom-0 left-[1.1875rem] top-11 w-px bg-rule-strong" aria-hidden="true" />
                ) : null}
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center bg-green-800 font-display text-lg font-semibold text-white">
                  {i + 1}
                </span>
                <div className="pt-1">
                  <h3 className="text-[1.5rem] font-semibold text-green-950">{s.title}</h3>
                  <p className="mt-2 max-w-[40rem] text-[1.0625rem] leading-relaxed text-slate">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Key information */}
      <section aria-labelledby="key-info" className="border-y border-rule bg-paper py-16 sm:py-20">
        <Container>
          <SectionHeading id="key-info" title="Key admission information" />
          <dl className="mt-10 grid border-t-2 border-green-900 bg-white md:grid-cols-3">
            <div className="border-b border-rule p-6 md:border-b-0 md:border-r">
              <dt className="font-display text-lg font-semibold text-green-950">Application fee</dt>
              <dd className="mt-2">
                <ul className="space-y-2">
                  {programmes.map((p) => (
                    <li key={p.slug} className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-[0.9375rem] text-slate">{p.abbreviation ?? p.shortTitle}</span>
                      <Fee amount={APPLICATION_FEES[p.slug]} size="sm" />
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="border-b border-rule p-6 md:border-b-0 md:border-r">
              <dt className="font-display text-lg font-semibold text-green-950">Application deadline</dt>
              <dd className="mt-2 text-[1.0625rem]">
                {site.admissions.deadline || <Tbd>To be announced by the Centre.</Tbd>}
              </dd>
            </div>
            <div className="p-6">
              <dt className="font-display text-lg font-semibold text-green-950">Supporting documents</dt>
              <dd className="mt-2 text-[1.0625rem]">
                <Tbd>List of required documents to be confirmed by the Centre.</Tbd>
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      {/* Requirements */}
      <section aria-labelledby="requirements" className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading id="requirements" title="Admission requirements" />
            <ButtonLink to="/requirements" variant="secondary" className="self-start md:self-auto">
              Check your eligibility
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.map((p) => (
              <li key={p.slug}>
                <RequirementCard programme={p} />
              </li>
            ))}
          </ul>
          <Notice className="mt-8 max-w-[48rem]">{REQUIREMENTS_NOTICE}</Notice>
        </Container>
      </section>

      {/* Continue payment */}
      <section aria-labelledby="continue-payment" className="border-t border-rule py-14">
        <Container className="grid gap-8 md:grid-cols-12 md:items-center">
          <div className="md:col-span-8">
            <h2 id="continue-payment" className="text-[1.875rem] font-semibold text-green-950">
              Already submitted an application?
            </h2>
            <p className="mt-3 max-w-[40rem] text-[1.0625rem] leading-relaxed text-slate">
              If your payment was not completed, your application is still saved. Enter your Application ID and email address
              to continue.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <ButtonLink to="/payment">Continue a payment</ButtonLink>
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  )
}
