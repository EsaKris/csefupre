import { useId, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type BaseProps = {
  label: string
  name: string
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
}

const controlBase =
  'block w-full rounded-[var(--radius)] border bg-white px-3.5 py-3 text-[1.0625rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-3 focus:ring-gold/60 disabled:bg-paper disabled:text-muted'

function controlClass(error?: string) {
  return `${controlBase} ${error ? 'border-danger' : 'border-rule-strong hover:border-slate focus:border-green-800'}`
}

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  className = '',
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
        {required ? null : <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[0.9375rem] text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex gap-1.5 text-[0.9375rem] font-semibold text-danger">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
}

export function FormInput({
  label,
  name,
  error,
  hint,
  required = true,
  className,
  ...rest
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const id = `${useId()}-${name}`
  return (
    <FieldShell id={id} label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClass(error)}
        {...rest}
      />
    </FieldShell>
  )
}

export function FormSelect({
  label,
  name,
  error,
  hint,
  required = true,
  className,
  options,
  placeholder = 'Select an option',
  ...rest
}: BaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> & {
    options: readonly (string | { value: string; label: string })[]
    placeholder?: string
  }) {
  const id = `${useId()}-${name}`
  return (
    <FieldShell id={id} label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} appearance-none bg-[length:1.1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232b312e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        })}
      </select>
    </FieldShell>
  )
}

export function FormTextarea({
  label,
  name,
  error,
  hint,
  required = true,
  className,
  ...rest
}: BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  const id = `${useId()}-${name}`
  return (
    <FieldShell id={id} label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={6}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} min-h-36 resize-y leading-relaxed`}
        {...rest}
      />
    </FieldShell>
  )
}

/** Hidden honeypot field. Positioned off-screen rather than display:none so naive bots still fill it. */
export function Honeypot({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name={name} tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}

/** Error summary shown at the top of a form after a failed submit. Receives focus. */
export function ErrorSummary({
  errors,
  labels,
  summaryRef,
}: {
  errors: Record<string, string>
  labels: Record<string, string>
  summaryRef: React.RefObject<HTMLDivElement | null>
}) {
  const entries = Object.entries(errors).filter(([k]) => k !== '_form')
  if (entries.length === 0) return null
  return (
    <div ref={summaryRef} tabIndex={-1} role="alert" className="border-l-4 border-danger bg-danger-bg px-5 py-4 outline-none">
      <p className="font-display text-lg font-semibold text-danger">
        {entries.length === 1 ? 'There is 1 problem to fix' : `There are ${entries.length} problems to fix`}
      </p>
      <ul className="mt-2 space-y-1 text-[0.9375rem]">
        {entries.map(([field, msg]) => (
          <li key={field}>
            <span className="font-semibold">{labels[field] ?? field}:</span> {msg}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Radio group rendered as a fieldset with a legend */
export function FormRadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  hint,
  required = true,
  columns = 'auto',
}: {
  legend: string
  name: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: ReactNode
  required?: boolean
  columns?: 'auto' | 2
}) {
  const id = `${useId()}-${name}`
  return (
    <fieldset aria-describedby={describedBy(id, hint, error)} aria-invalid={error ? true : undefined}>
      <legend className="font-semibold text-ink">
        {legend}
        {required ? null : <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </legend>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[0.9375rem] text-muted">
          {hint}
        </p>
      ) : null}
      <div className={`mt-2 grid gap-2 ${columns === 2 ? 'sm:grid-cols-2' : 'xs:grid-cols-2 sm:flex sm:flex-wrap'}`}>
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius)] border bg-white px-4 py-2.5 text-[1.0625rem] has-[:checked]:border-green-800 has-[:checked]:bg-green-50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-gold/60 ${
              error ? 'border-danger' : 'border-rule-strong hover:border-slate'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-5 w-5 shrink-0 accent-green-800"
            />
            {opt}
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex gap-1.5 text-[0.9375rem] font-semibold text-danger">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

export function FormCheckbox({
  name,
  label,
  checked,
  onChange,
  error,
}: {
  name: string
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}) {
  const id = `${useId()}-${name}`
  return (
    <div>
      <div className="flex gap-3">
        <input
          id={id}
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-green-800"
        />
        <label htmlFor={id} className="cursor-pointer text-[1.0625rem] leading-relaxed">
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="ml-9 mt-1 text-[0.9375rem] font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
