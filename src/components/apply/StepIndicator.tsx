import { Check } from 'lucide-react'
import { STEPS } from './steps'

type Props = { current: number; maxReached: number; onSelect: (step: number) => void }

/** Application progress. Completed steps can be revisited; Payment (6) is reached only by submitting. */
export function StepIndicator({ current, maxReached, onSelect }: Props) {
  const currentStep = STEPS[current - 1]
  return (
    <nav aria-label="Application progress">
      <p className="font-display text-lg font-semibold text-green-950">
        Step {current} of {STEPS.length}
        <span className="font-normal text-muted"> — {currentStep.label}</span>
      </p>

      {/* Mobile: segmented bar */}
      <div className="mt-3 grid grid-cols-6 gap-1 sm:hidden" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.key} className={`h-1.5 ${i + 1 < current ? 'bg-green-700' : i + 1 === current ? 'bg-gold' : 'bg-rule'}`} />
        ))}
      </div>

      {/* Wider screens: labelled steps */}
      <ol className="mt-4 hidden grid-cols-6 border-t border-rule sm:grid">
        {STEPS.map((s, i) => {
          const n = i + 1
          const done = n < current || (n <= maxReached && n !== current && n < 6)
          const isCurrent = n === current
          const reachable = n <= maxReached && n < 6 && !isCurrent
          const content = (
            <>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center font-display text-base font-semibold ${
                  isCurrent ? 'bg-gold text-ink' : done ? 'bg-green-800 text-white' : 'border border-rule-strong bg-white text-muted'
                }`}
              >
                {done && !isCurrent ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : n}
              </span>
              <span className={`text-[0.9375rem] ${isCurrent ? 'font-semibold text-ink' : done ? 'text-green-900' : 'text-muted'}`}>
                {s.label}
              </span>
            </>
          )
          return (
            <li key={s.key} className={`relative pt-3 ${isCurrent ? 'before:absolute before:inset-x-0 before:-top-px before:h-[3px] before:bg-gold' : ''}`}>
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(n)}
                  className="flex items-center gap-2 text-left underline-offset-4 hover:underline"
                >
                  {content}
                  <span className="sr-only">(completed, edit)</span>
                </button>
              ) : (
                <span className="flex items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
