import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import type { VerifyPaymentResult } from '../../../shared/schemas/payment'
import { ApiError } from '../../lib/api'
import { referenceFromSearch, verifyPayment } from '../../lib/payments'

type State =
  | { kind: 'checking' }
  | { kind: 'done'; result: VerifyPaymentResult }
  | { kind: 'error'; message: string }

/**
 * Returns the verified payment result for ?reference=.
 * Uses the result passed in navigation state when present (no second Paystack call),
 * otherwise verifies with the server — so outcome pages work on refresh or direct visit.
 */
export function useVerifiedPayment() {
  const [params] = useSearchParams()
  const location = useLocation()
  const reference = referenceFromSearch(params)
  const passed = (location.state as { result?: VerifyPaymentResult } | null)?.result
  const [state, setState] = useState<State>(() =>
    passed && passed.reference === reference ? { kind: 'done', result: passed } : { kind: 'checking' },
  )
  const inFlight = useRef(false)

  const check = useCallback(async () => {
    if (inFlight.current) return
    if (!reference) {
      setState({ kind: 'done', result: { outcome: 'not_found', reference: '' } })
      return
    }
    inFlight.current = true
    setState((s) => (s.kind === 'done' ? s : { kind: 'checking' }))
    try {
      const result = await verifyPayment(reference)
      setState({ kind: 'done', result })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'We could not confirm your payment right now.' })
    } finally {
      inFlight.current = false
    }
  }, [reference])

  useEffect(() => {
    if (state.kind === 'checking') void check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  return { reference, state, check }
}
