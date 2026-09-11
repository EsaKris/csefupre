import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { Lock, ShieldCheck } from 'lucide-react'
import { paymentLookupSchema, type PaymentApplicationSummary } from '../../shared/schemas/payment'
import { fieldErrors } from '../../shared/validation'
import { usePageMeta } from '../lib/seo'
import { ApiError, GENERIC_ERROR } from '../lib/api'
import { fetchSummaryByLookup, fetchSummaryByToken, startPayment } from '../lib/payments'
import { loadPaymentSession, savePaymentSession, clearPaymentSession } from '../lib/applicationDraft'
import { site } from '../config/site'
import { Container } from '../components/ui/Container'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Fee } from '../components/ui/Fee'
import { Notice } from '../components/ui/Notice'
import { ErrorSummary, FormInput } from '../components/forms/Field'
import { PaymentStatusBadge } from '../components/payment/PaymentStatusBadge'

type View =
  | { kind: 'loading' }
  | { kind: 'lookup'; notice?: string }
  | { kind: 'summary'; application: PaymentApplicationSummary; resumeToken: string }

const lookupLabels = { applicationId: 'Application ID', email: 'Email address' }

export default function Payment() {
  usePageMeta({
    title: 'Application payment',
    path: '/payment',
    index: false,
    description: 'Pay your application fee or continue an incomplete payment for the Centre for Safety Education, FUPRE.',
  })

  const location = useLocation()
  const fromSubmission = Boolean((location.state as { applicationId?: string } | null)?.applicationId)
  const [view, setView] = useState<View>(() => (loadPaymentSession() ? { kind: 'loading' } : { kind: 'lookup' }))
  const [lookup, setLookup] = useState({ applicationId: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [feeUnavailable, setFeeUnavailable] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const loaded = useRef(false)

  // Load the application from this tab's session (set after submission or a previous lookup)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const session = loadPaymentSession()
    if (!session) return
    fetchSummaryByToken(session.resumeToken)
      .then((r) => {
        if (r.status === 'found') {
          savePaymentSession({ applicationId: r.application.applicationId, resumeToken: r.resumeToken })
          setView({ kind: 'summary', application: r.application, resumeToken: r.resumeToken })
        } else {
          clearPaymentSession()
          setLookup((l) => ({ ...l, applicationId: session.applicationId }))
          setView({ kind: 'lookup', notice: 'For your security, please confirm your Application ID and email address to continue.' })
        }
      })
      .catch(() => {
        setLookup((l) => ({ ...l, applicationId: session.applicationId }))
        setView({ kind: 'lookup', notice: GENERIC_ERROR })
      })
  }, [])

  useEffect(() => {
    if (view.kind === 'summary') headingRef.current?.focus()
  }, [view.kind])

  async function onLookup(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const parsed = paymentLookupSchema.safeParse(lookup)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const r = await fetchSummaryByLookup(parsed.data.applicationId, parsed.data.email)
      if (r.status === 'found') {
        savePaymentSession({ applicationId: r.application.applicationId, resumeToken: r.resumeToken })
        setView({ kind: 'summary', application: r.application, resumeToken: r.resumeToken })
      } else {
        setMessage('We could not find an application with that Application ID and email address. Check both and try again, or contact admissions.')
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      else setMessage(err instanceof ApiError ? err.message : GENERIC_ERROR)
    } finally {
      setBusy(false)
    }
  }

  async function onProceed() {
    if (view.kind !== 'summary' || busy) return
    setBusy(true)
    setMessage('')
    try {
      const r = await startPayment(view.resumeToken)
      if (r.status === 'redirect') {
        // Leave the page for Paystack's secure checkout
        window.location.assign(r.authorizationUrl)
        return
      }
      if (r.status === 'already_paid') {
        const refreshed = await fetchSummaryByToken(view.resumeToken)
        if (refreshed.status === 'found') setView({ kind: 'summary', application: refreshed.application, resumeToken: refreshed.resumeToken })
      }
      if (r.status === 'fee_unavailable') setFeeUnavailable(true)
      setBusy(false)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : GENERIC_ERROR)
      setBusy(false)
    }
  }

  function lookUpAnother() {
    clearPaymentSession()
    setLookup({ applicationId: '', email: '' })
    setMessage('')
    setView({ kind: 'lookup' })
  }

  return (
    <>
      <div className="border-b border-rule bg-paper">
        <Container className="py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Admissions', to: '/admissions' }, { label: 'Payment' }]} />
          <h1 className="mt-4 text-[2.25rem] font-semibold text-green-950 sm:text-[2.75rem]">Application payment</h1>
          <p className="mt-1 text-slate">{site.centre.name}, {site.institution.shortName}</p>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {view.kind === 'loading' ? (
            <div role="status" className="border border-rule bg-white p-8 text-slate">
              Loading your application…
            </div>
          ) : null}

          {view.kind === 'lookup' ? (
            <section aria-labelledby="lookup-heading" className="border border-rule border-t-4 border-t-green-800 bg-white p-6 sm:p-8">
              <h2 id="lookup-heading" className="text-[1.875rem] font-semibold text-green-950">
                Continue a payment
              </h2>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-slate">
                Enter the Application ID you received when you applied, and the email address on your application.
              </p>
              {view.notice ? (
                <Notice tone="info" className="mt-5">
                  {view.notice}
                </Notice>
              ) : null}
              <form noValidate onSubmit={onLookup} className="mt-6 space-y-6">
                <ErrorSummary errors={errors} labels={lookupLabels} summaryRef={summaryRef} />
                {message ? (
                  <div role="alert" className="border-l-4 border-danger bg-danger-bg px-5 py-4 text-[0.9375rem]">
                    {message}
                  </div>
                ) : null}
                <FormInput
                  label="Application ID"
                  name="applicationId"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={15}
                  hint="For example CSE-2026-000001. It is in your application confirmation email."
                  value={lookup.applicationId}
                  error={errors.applicationId}
                  onChange={(e) => setLookup((l) => ({ ...l, applicationId: e.target.value.toUpperCase() }))}
                  className="[&_input]:font-mono [&_input]:tracking-wide"
                />
                <FormInput
                  label="Email address"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  value={lookup.email}
                  error={errors.email}
                  onChange={(e) => setLookup((l) => ({ ...l, email: e.target.value }))}
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to="/apply" className="link text-[0.9375rem]">
                    Have not applied yet? Start an application
                  </Link>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius)] bg-green-800 px-6 font-display text-[1.0625rem] font-semibold text-white hover:bg-green-950 disabled:cursor-wait disabled:opacity-70"
                  >
                    {busy ? 'Finding application…' : 'Find my application'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {view.kind === 'summary' ? (
            <SummaryPanel
              application={view.application}
              fromSubmission={fromSubmission}
              busy={busy}
              message={message}
              feeUnavailable={feeUnavailable}
              headingRef={headingRef}
              onProceed={onProceed}
              onLookUpAnother={lookUpAnother}
            />
          ) : null}
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="border border-rule bg-paper p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-green-950">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-green-700" />
              Secure payment
            </h2>
            <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-relaxed text-slate">
              <li>Payment is completed on Paystack's secure checkout.</li>
              <li>Your card details are entered on Paystack. This website does not see or store them.</li>
              <li>Your payment is confirmed directly with Paystack before it is recorded.</li>
            </ul>
          </div>
          <div className="border border-rule p-6">
            <h2 className="font-display text-xl font-semibold text-green-950">Payment problems?</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate">
              If money left your account but your payment shows as incomplete, do not pay again. Email{' '}
              <a href={`mailto:${site.contact.email}`} className="link">
                {site.contact.email}
              </a>{' '}
              with your Application ID.
            </p>
          </div>
        </aside>
      </Container>
    </>
  )
}

function SummaryPanel({
  application: a,
  fromSubmission,
  busy,
  message,
  feeUnavailable,
  headingRef,
  onProceed,
  onLookUpAnother,
}: {
  application: PaymentApplicationSummary
  fromSubmission: boolean
  busy: boolean
  message: string
  feeUnavailable: boolean
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onProceed: () => void
  onLookUpAnother: () => void
}) {
  const paid = a.paymentStatus === 'Success'
  const inProgress = ['Ongoing', 'Processing', 'Queued'].includes(a.paymentStatus)
  const incomplete = ['Abandoned', 'Failed', 'Reversed'].includes(a.paymentStatus)
  const noFee = a.fee === null || feeUnavailable

  const heading = paid
    ? 'Payment received'
    : fromSubmission && a.paymentStatus === 'Not Started'
      ? 'Your application has been received.'
      : incomplete
        ? 'Your application has been saved.'
        : 'Your application'

  return (
    <section aria-labelledby="summary-heading" className="border border-rule border-t-4 border-t-green-800 bg-white">
      <div className="p-6 sm:p-8">
        <h2 ref={headingRef} id="summary-heading" tabIndex={-1} className="text-[1.875rem] font-semibold leading-tight text-green-950 outline-none sm:text-[2.125rem]">
          {heading}
        </h2>
        <p className="mt-2 text-[1.0625rem] text-slate">
          {paid
            ? 'Your application fee has been paid and your application has been submitted successfully.'
            : inProgress
              ? 'A payment for this application is being processed. Please check back shortly before paying again.'
              : incomplete
                ? 'Your payment has not been completed. Use the button below to continue your payment.'
                : 'Your application is awaiting payment.'}
        </p>

        <div className="mt-6 border-l-4 border-gold bg-paper px-5 py-4">
          <p className="text-sm text-muted">Application ID</p>
          <p className="font-mono text-[1.625rem] font-semibold tracking-wide text-green-950">{a.applicationId}</p>
          {fromSubmission ? <p className="mt-1 text-[0.9375rem] text-slate">Keep this ID. You need it, with your email address, to continue a payment later.</p> : null}
        </div>

        <dl className="mt-6 divide-y divide-rule border-y border-rule">
          <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-muted">Applicant</dt>
            <dd className="font-semibold">{a.applicantName}</dd>
          </div>
          <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-muted">Programme</dt>
            <dd>{a.programmeName}</dd>
          </div>
          <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-muted">Application fee</dt>
            <dd>{noFee ? <span className="text-slate">Not yet published</span> : <Fee amount={a.fee} />}</dd>
          </div>
          <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:items-center sm:gap-4">
            <dt className="text-muted">Payment status</dt>
            <dd>
              <PaymentStatusBadge status={a.paymentStatus} />
            </dd>
          </div>
        </dl>

        {message ? (
          <div role="alert" className="mt-6 border-l-4 border-danger bg-danger-bg px-5 py-4 text-[0.9375rem]">
            {message}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onLookUpAnother} className="link text-left text-[0.9375rem]">
            Not your application? Look up another
          </button>
          {paid ? (
            a.paidReference ? (
              <Link
                to={`/application-success?reference=${encodeURIComponent(a.paidReference)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius)] bg-green-800 px-6 font-display text-[1.0625rem] font-semibold text-white hover:bg-green-950"
              >
                View payment confirmation
              </Link>
            ) : null
          ) : noFee ? (
            <p className="text-[0.9375rem] text-slate">Admissions will contact you about the application fee.</p>
          ) : (
            <button
              type="button"
              onClick={onProceed}
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-green-800 px-6 font-display text-[1.125rem] font-semibold text-white hover:bg-green-950 disabled:cursor-wait disabled:opacity-70"
            >
              <Lock aria-hidden="true" className="h-4 w-4" />
              {busy ? 'Opening secure checkout…' : incomplete ? 'Continue Payment' : 'Proceed to Payment'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
