import { Link } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { site } from '../config/site'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { Notice } from '../components/ui/Notice'
import { Tbd } from '../components/ui/Tbd'
import { InPageNav } from '../components/content/InPageNav'
import { DocSection } from '../components/content/DocSection'

const sections = [
  { id: 'about', label: 'About these terms' },
  { id: 'accuracy', label: 'Accuracy of your application' },
  { id: 'submission', label: 'Submitting an application' },
  { id: 'payment', label: 'Payment' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'admission', label: 'Admission' },
  { id: 'discretion', label: 'Institutional discretion' },
  { id: 'communication', label: 'Communication' },
  { id: 'website-use', label: 'Use of this website' },
  { id: 'changes', label: 'Changes to programme information' },
  { id: 'contact', label: 'Contact' },
]

export default function Terms() {
  usePageMeta({
    title: 'Terms',
    path: '/terms',
    description:
      'Terms for applying to the Centre for Safety Education, FUPRE: application accuracy, submission, payment, admission, communication and use of this website.',
  })

  const email = site.contact.email

  return (
    <>
      <PageHeader title="Application and website terms" crumbs={[{ label: 'Terms' }]} compact>
        <p className="mt-4 text-green-100">
          Last updated: <Tbd>date of approval</Tbd>
        </p>
      </PageHeader>

      <Container className="py-12 sm:py-14">
        <Notice tone="caution" title="Draft for institutional review" className="max-w-[48rem]">
          These terms must be reviewed and approved by the University and its legal adviser before publication. Remove this notice
          once they have been approved.
        </Notice>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <InPageNav links={sections} />
          </div>

          <div className="space-y-10 lg:col-span-9">
            <DocSection id="about" title="About these terms">
              <p>
                These terms apply when you use this website or submit an application to the {site.centre.name}, {site.institution.name}.
                By submitting an application, you confirm that you have read and accept them, along with the{' '}
                <Link to="/privacy-policy">Privacy Policy</Link>.
              </p>
            </DocSection>

            <DocSection id="accuracy" title="Accuracy of your application">
              <p>
                You must provide information that is true, complete and your own. The Centre may ask you to provide documents that
                support the information in your application.
              </p>
              <p>
                If information in an application is found to be false or misleading, the Centre may decline the application or
                withdraw any offer made on the basis of it.
              </p>
            </DocSection>

            <DocSection id="submission" title="Submitting an application">
              <ul>
                <li>An application is recorded when you submit the form and an Application ID is shown to you.</li>
                <li>Keep your Application ID. You need it, with your email address, to continue a payment or ask about your application.</li>
                <li>
                  If an application already exists for your email address, you will be directed to that application rather than
                  creating a duplicate.
                </li>
              </ul>
            </DocSection>

            <DocSection id="payment" title="Payment">
              <ul>
                <li>The application fee is set by the Centre and is shown on the payment page before you pay.</li>
                <li>Payments are processed by Paystack. Your payment details are entered on Paystack's checkout, not on this website.</li>
                <li>
                  A payment is treated as successful only after it has been verified with Paystack. Reaching a confirmation page in
                  your browser does not by itself confirm payment.
                </li>
                <li>
                  If you are unsure whether a payment went through, do not pay again. Contact admissions with your Application ID
                  and payment reference.
                </li>
              </ul>
            </DocSection>

            <DocSection id="refunds" title="Refunds">
              <p>
                <Tbd>Refund policy for application fees, including any circumstances in which a refund is available and how to request one, to be confirmed by the Centre.</Tbd>
              </p>
            </DocSection>

            <DocSection id="admission" title="Admission">
              <p>
                Submitting an application or paying the application fee does not guarantee admission. Applications are assessed
                against the admission requirements and procedures of the Centre and the University.
              </p>
            </DocSection>

            <DocSection id="discretion" title="Institutional discretion">
              <p>
                Admission decisions, programme availability, intake numbers and scheduling are at the discretion of the Centre and
                the University, in line with their policies and regulations.
              </p>
            </DocSection>

            <DocSection id="communication" title="Communication">
              <p>
                The Centre will contact you using the email address and phone number in your application. Keep these details
                current and check your spam or junk folder for messages about your application.
              </p>
            </DocSection>

            <DocSection id="website-use" title="Use of this website">
              <p>You must not:</p>
              <ul>
                <li>submit applications or enquiries on behalf of another person without their authority;</li>
                <li>use automated tools to submit forms or to access the website in bulk;</li>
                <li>attempt to access another applicant's information or interfere with the website's operation or security.</li>
              </ul>
            </DocSection>

            <DocSection id="changes" title="Changes to programme information">
              <p>
                Programme information on this website, including durations, requirements and course offerings, is provided in good
                faith and may change. Applicants should confirm the latest official information with the Centre before applying.
              </p>
            </DocSection>

            <DocSection id="contact" title="Contact">
              <p>
                Email <a href={`mailto:${email}`}>{email}</a> or call {site.contact.phones.map((p) => p.display).join(' or ')}.
              </p>
            </DocSection>
          </div>
        </div>
      </Container>
    </>
  )
}
