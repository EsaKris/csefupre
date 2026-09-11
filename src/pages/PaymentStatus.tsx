import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { useVerifiedPayment } from '../components/payment/useVerifiedPayment'
import { CheckingPayment, VerifyError, outcomePath } from '../components/payment/PaymentOutcomeView'

/**
 * Paystack returns applicants here (/payment/status?reference=…).
 * Reaching this page proves nothing: the server verifies the transaction with Paystack,
 * then the applicant is sent to the matching outcome page.
 */
export default function PaymentStatus() {
  usePageMeta({ title: 'Confirming payment', path: '/payment/status', index: false, description: 'Confirming your application payment.' })
  const navigate = useNavigate()
  const { state, check } = useVerifiedPayment()

  useEffect(() => {
    if (state.kind === 'done') navigate(outcomePath(state.result), { replace: true, state: { result: state.result } })
  }, [state, navigate])

  if (state.kind === 'error') return <VerifyError message={state.message} onRetry={check} />
  return <CheckingPayment />
}
