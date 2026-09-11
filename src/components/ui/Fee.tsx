import { FEES_ARE_PLACEHOLDERS, formatNaira } from '../../../shared/fees'
import { Tbd } from './Tbd'

type Props = { amount: number | null | undefined; className?: string; size?: 'sm' | 'lg' }

/**
 * Displays a fee from shared/fees.ts.
 * Shows "To be confirmed" when unset, and a visible "Sample fee" tag while
 * FEES_ARE_PLACEHOLDERS is true so placeholder prices are never mistaken for real ones.
 */
export function Fee({ amount, className = '', size = 'lg' }: Props) {
  if (amount === null || amount === undefined) {
    return (
      <span className={className}>
        <Tbd>To be confirmed</Tbd>
      </span>
    )
  }
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className={`font-display font-semibold text-green-900 ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>{formatNaira(amount)}</span>
      {FEES_ARE_PLACEHOLDERS ? (
        <mark className="tbd whitespace-nowrap text-xs font-semibold" title="Placeholder amount — replace in shared/fees.ts">
          Sample fee
        </mark>
      ) : null}
    </span>
  )
}
