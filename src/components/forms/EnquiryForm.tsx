import { useRef, useState, type FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router'
import { CheckCircle2 } from 'lucide-react'
import { enquirySchema, ENQUIRY_TYPES } from '../../../shared/schemas/enquiry'
import { fieldErrors, HONEYPOT_FIELD } from '../../../shared/validation'
import { courses, getCourse, courseLabel } from '../../config/courses'
import { site } from '../../config/site'
import { postJson, ApiError } from '../../lib/api'
import { FormInput, FormSelect, FormTextarea, Honeypot, ErrorSummary } from './Field'

const labels: Record<string, string> = {
  fullName: 'Full name',
  email: 'Email address',
  phone: 'Phone number',
  enquiryType: 'Enquiry about',
  course: 'Course',
  message: 'Message',
}

type State = 'idle' | 'submitting' | 'sent' | 'error'

export function EnquiryForm() {
  const [params] = useSearchParams()
  const presetTopic = params.get('topic')
  const presetCourse = getCourse(params.get('course'))

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    enquiryType: (ENQUIRY_TYPES as readonly string[]).includes(presetTopic ?? '') ? (presetTopic as string) : '',
    course: presetCourse?.slug ?? '',
    message: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<State>('idle')
  const [formError, setFormError] = useState('')
  const summaryRef = useRef<HTMLDivElement>(null)
  const sentRef = useRef<HTMLDivElement>(null)

  const set = (name: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const parsed = enquirySchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setErrors({})
    setState('submitting')
    try {
      await postJson('/api/enquiries', { ...parsed.data, [HONEYPOT_FIELD]: honeypot })
      setState('sent')
      requestAnimationFrame(() => sentRef.current?.focus())
    } catch (err) {
      setState('error')
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors)
        requestAnimationFrame(() => summaryRef.current?.focus())
      } else {
        setFormError(
          `Your enquiry could not be sent. Please try again, or email admissions directly at ${site.contact.email}.`,
        )
      }
    }
  }

  if (state === 'sent') {
    return (
      <div ref={sentRef} tabIndex={-1} role="status" className="border-l-4 border-green-800 bg-green-50 p-6 outline-none">
        <p className="flex items-center gap-2 font-display text-2xl font-semibold text-green-950">
          <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-green-700" />
          Enquiry sent
        </p>
        <p className="mt-3 text-[1.0625rem] leading-relaxed">
          Admissions will reply to <strong>{values.email.trim()}</strong>. If your enquiry is urgent, call{' '}
          <a className="link" href={`tel:${site.contact.phones[0].tel}`}>
            {site.contact.phones[0].display}
          </a>
          .
        </p>
      </div>
    )
  }

  const showCourse = values.enquiryType === 'Short courses'

  return (
    <form noValidate onSubmit={onSubmit} className="relative space-y-6" aria-describedby="enquiry-privacy">
      <ErrorSummary errors={errors} labels={labels} summaryRef={summaryRef} />
      {formError ? (
        <div role="alert" className="border-l-4 border-danger bg-danger-bg px-5 py-4 text-[0.9375rem]">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormInput label="Full name" name="fullName" autoComplete="name" maxLength={120} value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
        <FormInput label="Email address" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={values.email} onChange={set('email')} error={errors.email} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormInput label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} required={false} value={values.phone} onChange={set('phone')} error={errors.phone} />
        <FormSelect label="Enquiry about" name="enquiryType" options={ENQUIRY_TYPES} value={values.enquiryType} onChange={set('enquiryType')} error={errors.enquiryType} />
      </div>
      {showCourse ? (
        <FormSelect
          label="Course"
          name="course"
          required={false}
          placeholder="Not sure yet / general enquiry"
          options={courses.map((c) => ({ value: c.slug, label: courseLabel(c) }))}
          value={values.course}
          onChange={set('course')}
          error={errors.course}
        />
      ) : null}
      <FormTextarea
        label="Message"
        name="message"
        maxLength={2000}
        hint="Include your Application ID if your enquiry is about an application you have already submitted."
        value={values.message}
        onChange={set('message')}
        error={errors.message}
      />
      <Honeypot name={HONEYPOT_FIELD} value={honeypot} onChange={setHoneypot} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id="enquiry-privacy" className="text-[0.9375rem] text-muted">
          Your details are used only to respond to your enquiry. See the{' '}
          <Link to="/privacy-policy" className="link">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-green-800 px-6 font-display text-[1.0625rem] font-semibold text-white hover:bg-green-950 disabled:cursor-wait disabled:opacity-70"
        >
          {state === 'submitting' ? 'Sending enquiry…' : 'Send enquiry'}
        </button>
      </div>
    </form>
  )
}
