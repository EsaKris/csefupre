import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Printer } from 'lucide-react'
import type { VerifyPaymentResult } from '../../../shared/schemas/payment'
import { formatNaira } from '../../../shared/fees'
import { site } from '../../config/site'
import { Container } from '../ui/Container'
import { DetailList, OutcomeLayout, primaryBtn, secondaryBtn } from './OutcomeLayout'
import { PaymentStatusBadge } from './PaymentStatusBadge'

const contactHref = `/contact?topic=${encodeURIComponent('Application or payment')}`

function formatDateTime(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'long', timeStyle: 'short' })
}

export function CheckingPayment() {
  return (
    <Container className="py-16">
      <div role="status" aria-live="polite" className="mx-auto max-w-[40rem] border border-rule bg-white p-8 text-center">
        <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-rule border-t-green-800 motion-reduce:animate-none" aria-hidden="true" />
        <h1 className="mt-5 text-[1.875rem] font-semibold text-green-950">Confirming your payment…</h1>
        <p className="mt-2 text-slate">Checking with Paystack. Please do not close this page or pay again.</p>
      </div>
    </Container>
  )
}

export function VerifyError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <OutcomeLayout
      tone="review"
      title="We could not confirm your payment yet"
      lead={message}
      actions={
        <>
          <button type="button" onClick={onRetry} className={primaryBtn}>
            Check again
          </button>
          <Link to={contactHref} className={secondaryBtn}>
            Contact Admissions
          </Link>
        </>
      }
    />
  )
}

export function SuccessView({ result }: { result: VerifyPaymentResult }) {
  const paidAt = formatDateTime(result.paidAt)
  const rows: [string, React.ReactNode][] = [
    ['Application ID', <span className="font-mono tracking-wide">{result.applicationId}</span>],
    ...(result.programmeName ? ([['Programme', result.programmeName]] as [string, React.ReactNode][]) : []),
    ...(result.amount ? ([['Amount paid', formatNaira(result.amount)]] as [string, React.ReactNode][]) : []),
    ['Payment reference', <span className="font-mono text-[0.9375rem]">{result.reference}</span>],
    ['Payment status', <PaymentStatusBadge status="Success" />],
    ...(paidAt ? ([['Date', paidAt]] as [string, React.ReactNode][]) : []),
  ]
  return (
    <OutcomeLayout
      tone="success"
      title="Payment Successful"
      lead="Your application has been submitted successfully. A confirmation has been sent to the email address on your application."
      actions={
        <>
          <button type="button" onClick={() => window.print()} className={primaryBtn}>
            <Printer aria-hidden="true" className="h-5 w-5" />
            Download/Print Confirmation
          </button>
          <Link to="/" className={secondaryBtn}>
            Return to CSE
          </Link>
        </>
      }
    >
      <DetailList rows={rows} />
      <p className="mt-6 text-[0.9375rem] leading-relaxed text-slate">
        Keep this confirmation. Admissions will contact you using the details in your application. For questions, email{' '}
        <a href={`mailto:${site.contact.email}`} className="link">
          {site.contact.email}
        </a>{' '}
        and quote your Application ID.
      </p>
    </OutcomeLayout>
  )
}

export function PendingView({ result, onRetry }: { result: VerifyPaymentResult; onRetry: () => void }) {
  const [checks, setChecks] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const MAX_AUTO = 8

  // Re-check automatically every 15 seconds, a limited number of times
  useEffect(() => {
    if (checks >= MAX_AUTO) return
    timer.current = window.setTimeout(() => {
      setChecks((c) => c + 1)
      onRetry()
    }, 15000)
    return () => window.clearTimeout(timer.current)
  }, [checks, onRetry])

  return (
    <OutcomeLayout
      tone="pending"
      title="Your payment is being confirmed"
      lead="Your application has been saved, but payment is still pending. Some payment methods, such as bank transfers, take a few minutes to confirm."
      actions={
        <>
          <button type="button" onClick={onRetry} className={primaryBtn}>
            Check again
          </button>
          <Link to={contactHref} className={secondaryBtn}>
            Contact Admissions
          </Link>
        </>
      }
    >
      <DetailList
        rows={[
          ['Application ID', <span className="font-mono tracking-wide">{result.applicationId}</span>],
          ['Payment reference', <span className="font-mono text-[0.9375rem]">{result.reference}</span>],
          ['Payment status', <PaymentStatusBadge status="Processing" />],
        ]}
      />
      <p className="mt-6 border-l-4 border-gold bg-caution-bg px-5 py-4 text-[0.9375rem] leading-relaxed">
        <strong>Please do not pay again</strong> while this payment is being confirmed.
        {checks < MAX_AUTO ? ' This page checks again automatically.' : ' You will also receive an email once payment is confirmed.'}
      </p>
    </OutcomeLayout>
  )
}

export function IncompleteView({ result }: { result: VerifyPaymentResult }) {
  const copy = {
    abandoned: {
      title: 'Your application has been saved.',
      lead: 'Your payment has not been completed. Use the button below to continue your payment.',
      tone: 'failed' as const,
      primary: 'Continue Payment',
    },
    failed: {
      title: 'Payment could not be completed.',
      lead: 'The payment was not successful. Your application is still saved, and no fee has been recorded. You can try again, or contact admissions for help.',
      tone: 'failed' as const,
      primary: 'Try Payment Again',
    },
    reversed: {
      title: 'This payment was reversed.',
      lead: 'The payment for your application was reversed. Contact admissions before paying again.',
      tone: 'failed' as const,
      primary: null,
    },
    review: {
      title: 'We need to confirm your payment.',
      lead: 'Your payment needs to be checked by admissions before it can be recorded. Please do not pay again. Contact admissions with your Application ID and payment reference.',
      tone: 'review' as const,
      primary: null,
    },
    not_found: {
      title: 'We could not find that payment.',
      lead: 'The payment link may be incomplete. If you have an application, continue your payment using your Application ID and email address.',
      tone: 'review' as const,
      primary: 'Continue a Payment',
    },
  }[result.outcome as 'abandoned' | 'failed' | 'reversed' | 'review' | 'not_found']

  const rows: [string, React.ReactNode][] = []
  if (result.applicationId) rows.push(['Application ID', <span className="font-mono tracking-wide">{result.applicationId}</span>])
  if (result.reference) rows.push(['Payment reference', <span className="font-mono text-[0.9375rem]">{result.reference}</span>])
  if (result.outcome !== 'not_found') {
    const badge = { abandoned: 'Abandoned', failed: 'Failed', reversed: 'Reversed', review: 'Processing' }[result.outcome as 'abandoned' | 'failed' | 'reversed' | 'review']
    rows.push(['Payment status', <PaymentStatusBadge status={badge} />])
  }

  return (
    <OutcomeLayout
      tone={copy.tone}
      title={copy.title}
      lead={copy.lead}
      actions={
        <>
          {copy.primary ? (
            <Link to="/payment" className={primaryBtn}>
              {copy.primary}
            </Link>
          ) : null}
          <Link to={contactHref} className={copy.primary ? secondaryBtn : primaryBtn}>
            Contact Admissions
          </Link>
        </>
      }
    >
      {rows.length ? <DetailList rows={rows} /> : null}
    </OutcomeLayout>
  )
}

/** Route for an outcome so each has its own URL */
export function outcomePath(result: VerifyPaymentResult): string {
  const q = result.reference ? `?reference=${encodeURIComponent(result.reference)}` : ''
  if (result.outcome === 'success') return `/application-success${q}`
  if (result.outcome === 'pending') return `/application-payment-pending${q}`
  return `/application-payment-failed${q}`
}

export function OutcomeForResult({ result, onRetry }: { result: VerifyPaymentResult; onRetry: () => void }) {
  if (result.outcome === 'success') return <SuccessView result={result} />
  if (result.outcome === 'pending') return <PendingView result={result} onRetry={onRetry} />
  return <IncompleteView result={result} />
}
