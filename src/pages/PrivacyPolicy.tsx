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
  { id: 'about', label: 'About this policy' },
  { id: 'information-collected', label: 'Information we collect' },
  { id: 'why', label: 'Why we collect it' },
  { id: 'applications', label: 'How applications are processed' },
  { id: 'payments', label: 'Payment processing' },
  { id: 'storage', label: 'Where information is stored' },
  { id: 'email', label: 'Email communication' },
  { id: 'cookies', label: 'Cookies and browser storage' },
  { id: 'security', label: 'Data security' },
  { id: 'retention', label: 'Data retention' },
  { id: 'processors', label: 'Third-party processors' },
  { id: 'rights', label: 'Your rights' },
  { id: 'requests', label: 'Correction and deletion requests' },
  { id: 'changes', label: 'Changes to this policy' },
  { id: 'contact', label: 'Contact' },
]

export default function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy',
    path: '/privacy-policy',
    description:
      'How the Centre for Safety Education, FUPRE collects, uses, stores and protects personal information submitted through applications, payments and enquiries on this website.',
  })

  const email = site.contact.email

  return (
    <>
      <PageHeader title="Privacy Policy" crumbs={[{ label: 'Privacy Policy' }]} compact>
        <p className="mt-4 text-green-100">
          Last updated: <Tbd>date of approval</Tbd>
        </p>
      </PageHeader>

      <Container className="py-12 sm:py-14">
        <Notice tone="caution" title="Draft for institutional review" className="max-w-[48rem]">
          This policy must be reviewed and approved by the University and its legal adviser before publication. Remove this notice
          once it has been approved.
        </Notice>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <InPageNav links={sections} />
          </div>

          <div className="space-y-10 lg:col-span-9">
            <DocSection id="about" title="About this policy">
              <p>
                This policy explains how the {site.centre.name} ("CSE", "the Centre", "we"), part of the {site.institution.name}{' '}
                (FUPRE), handles personal information submitted through this website.
              </p>
              <p>
                It applies to the online application form, application payments, the enquiry form and general use of the website.
                We aim to handle personal information in line with applicable Nigerian data protection law, including the Nigeria
                Data Protection Act 2023.
              </p>
            </DocSection>

            <DocSection id="information-collected" title="Information we collect">
              <h3>When you apply</h3>
              <ul>
                <li>Personal details: first and last name, email address, phone number, date of birth, gender, country, state and address.</li>
                <li>Programme details: the programme you are applying for.</li>
                <li>Educational background: highest qualification, institution, course of study, graduation year and grade or classification.</li>
                <li>Professional information: employment status, organisation, job title and years of experience.</li>
                <li>Application information: your reason for applying, how you heard about the Centre, and your preferred contact method.</li>
                <li>Your confirmation that you accept this policy and the application terms.</li>
              </ul>
              <h3>When you pay</h3>
              <ul>
                <li>
                  Payment records: payment reference, Paystack transaction ID, amount, currency, payment status and payment date.
                </li>
                <li>
                  We do <strong>not</strong> receive or store your card number, card security code, PIN or bank login details.
                </li>
              </ul>
              <h3>When you send an enquiry</h3>
              <ul>
                <li>Your name, email address, optional phone number, enquiry topic and message.</li>
              </ul>
              <h3>Technical information</h3>
              <ul>
                <li>
                  Our hosting provider records standard server logs, such as IP address, browser type, requested pages and
                  timestamps, which are used to operate and secure the website.
                </li>
              </ul>
            </DocSection>

            <DocSection id="why" title="Why we collect it">
              <ul>
                <li>To receive, record and assess your application for admission.</li>
                <li>To verify application payments and match them to the correct application.</li>
                <li>To contact you about your application, including when an application has been submitted but payment has not been completed.</li>
                <li>To respond to enquiries.</li>
                <li>To prevent duplicate, fraudulent or automated submissions and to keep the website secure.</li>
              </ul>
            </DocSection>

            <DocSection id="applications" title="How applications are processed">
              <p>
                When you submit an application, it is validated by the website's server and saved to the Centre's application
                records, where it is given a unique Application ID. The record is kept even if payment is not completed, so that
                admissions staff can assist you.
              </p>
              <p>
                Application records are accessed by authorised Centre staff for admissions administration and follow-up.
              </p>
            </DocSection>

            <DocSection id="payments" title="Payment processing">
              <p>
                Application payments are processed by Paystack, a third-party payment provider. When you proceed to payment, you
                are taken to Paystack's secure checkout, where you enter your payment details directly with Paystack.
              </p>
              <p>
                Payment card details are handled by Paystack and are not stored by this website. After payment, our server
                confirms the transaction status directly with Paystack and records the outcome against your application. Paystack's
                handling of your information is governed by Paystack's own privacy policy, available on Paystack's website.
              </p>
            </DocSection>

            <DocSection id="storage" title="Where information is stored">
              <p>
                Application and enquiry records are stored in Google Sheets within a Google account managed by the Centre. The
                website is hosted on Vercel. These providers may store or process information on servers located outside Nigeria.
              </p>
            </DocSection>

            <DocSection id="email" title="Email communication">
              <p>
                We may email you to confirm receipt of your application, confirm or report on a payment, remind you about an
                incomplete payment, and follow up on your application or enquiry. Emails are sent through an email delivery
                provider acting on the Centre's behalf.
              </p>
            </DocSection>

            <DocSection id="cookies" title="Cookies and browser storage">
              <p>This website does not use advertising cookies or third-party analytics cookies.</p>
              <p>
                While you complete the application form, your progress is kept temporarily in your browser's session storage so
                that it is not lost if the page reloads. It is cleared when you submit your application or close the browser tab.
              </p>
              <p>Paystack's checkout pages may use their own cookies, which are governed by Paystack's policies.</p>
            </DocSection>

            <DocSection id="security" title="Data security">
              <p>We use measures intended to protect your information, including:</p>
              <ul>
                <li>encrypted HTTPS connections for every page and form;</li>
                <li>server-side validation of all submitted information;</li>
                <li>keeping payment and data-store credentials on the server, never in the browser;</li>
                <li>verifying payment notifications from Paystack before recording them;</li>
                <li>limiting access to application records to authorised staff.</li>
              </ul>
              <p>No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
            </DocSection>

            <DocSection id="retention" title="Data retention">
              <p>
                Application and payment records are kept for <Tbd>retention period to be set by the University</Tbd>. Enquiry
                records are kept for <Tbd>retention period to be set by the University</Tbd>. Some payment records may need to be
                kept for longer to meet financial and audit obligations.
              </p>
            </DocSection>

            <DocSection id="processors" title="Third-party processors">
              <ul>
                <li><strong>Paystack</strong>: payment processing.</li>
                <li><strong>Google</strong>: storage of application and enquiry records (Google Sheets and Apps Script).</li>
                <li><strong>Vercel</strong>: website hosting and server functions.</li>
                <li><strong>Email delivery provider</strong>: sending application and payment emails, once enabled.</li>
              </ul>
              <p>We do not sell personal information.</p>
            </DocSection>

            <DocSection id="rights" title="Your rights">
              <p>Subject to applicable law, you may have the right to:</p>
              <ul>
                <li>ask what personal information we hold about you;</li>
                <li>ask us to correct inaccurate information;</li>
                <li>ask us to delete your information, where we are not required to keep it;</li>
                <li>object to or ask us to restrict certain uses of your information;</li>
                <li>withdraw consent where we rely on your consent.</li>
              </ul>
              <p>You may also have the right to lodge a complaint with the Nigeria Data Protection Commission.</p>
            </DocSection>

            <DocSection id="requests" title="Correction and deletion requests">
              <p>
                Email <a href={`mailto:${email}`}>{email}</a> from the email address you used on your application, and include your
                Application ID if you have one. We may need to confirm your identity before acting on a request, so that we do not
                disclose or change another person's information.
              </p>
            </DocSection>

            <DocSection id="changes" title="Changes to this policy">
              <p>
                We may update this policy. The date at the top of the page shows when it was last changed. Please also read our{' '}
                <Link to="/terms">Terms</Link>.
              </p>
            </DocSection>

            <DocSection id="contact" title="Contact">
              <p>
                {site.centre.name}, {site.contact.address.join(', ')}.
                <br />
                Email: <a href={`mailto:${email}`}>{email}</a>
                <br />
                Telephone: {site.contact.phones.map((p) => p.display).join(', ')}
              </p>
              <p>
                Data protection contact: <Tbd>name or office of the University's data protection officer, if applicable</Tbd>
              </p>
            </DocSection>
          </div>
        </div>
      </Container>
    </>
  )
}
