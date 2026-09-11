import { Link } from 'react-router'
import { site } from '../../config/site'
import { Container } from './Container'
import { ButtonAnchor, ButtonLink } from './Button'

type Props = {
  heading?: string
  text?: string
  applyTo?: string
  applyLabel?: string
}

/** Application call-to-action band used at the foot of content pages */
export function CTASection({
  heading = 'Ready to apply?',
  text = 'Complete the online application form. You will receive an Application ID as soon as you submit.',
  applyTo = '/apply',
  applyLabel = 'Apply Now',
}: Props) {
  return (
    <section aria-label="Apply" className="bg-green-900 text-white">
      <Container className="flex flex-col gap-8 py-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[38rem]">
          <h2 className="text-[2rem] font-semibold sm:text-[2.5rem]">{heading}</h2>
          <p className="mt-3 text-lg text-green-100">{text}</p>
        </div>
        <div className="flex flex-col gap-3 xs:flex-row lg:shrink-0">
          <ButtonLink to={applyTo} variant="onDark">
            {applyLabel}
          </ButtonLink>
          <ButtonAnchor href={`mailto:${site.contact.email}`} variant="onDarkOutline">
            Contact Admissions
          </ButtonAnchor>
        </div>
      </Container>
      <Container className="border-t border-white/15 py-4 text-[0.9375rem] text-green-100">
        Already applied?{' '}
        <Link to="/payment" className="text-white underline underline-offset-4">
          Continue an incomplete payment
        </Link>
      </Container>
    </section>
  )
}
