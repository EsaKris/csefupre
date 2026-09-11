import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { usePageMeta } from '../lib/seo'
import { useVerifiedPayment } from '../components/payment/useVerifiedPayment'
import { CheckingPayment, OutcomeForResult, VerifyError, outcomePath } from '../components/payment/PaymentOutcomeView'

export default function PaymentPending() {
  usePageMeta({ title: 'Payment pending', path: '/application-payment-pending', index: false, description: 'Application payment outcome — Centre for Safety Education, FUPRE.' })
  const navigate = useNavigate()
  const { state, check } = useVerifiedPayment()

  // If the verified outcome belongs on a different page (e.g. a pending payment has now succeeded), move there
  useEffect(() => {
    if (state.kind === 'done' && !outcomePath(state.result).startsWith('/application-payment-pending')) {
      navigate(outcomePath(state.result), { replace: true, state: { result: state.result } })
    }
  }, [state, navigate])

  if (state.kind === 'checking') return <CheckingPayment />
  if (state.kind === 'error') return <VerifyError message={state.message} onRetry={check} />
  return <OutcomeForResult result={state.result} onRetry={check} />
}
