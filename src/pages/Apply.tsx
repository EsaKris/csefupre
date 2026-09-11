import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { RotateCcw, ShieldCheck } from 'lucide-react'
import {
  applicationLabels,
  applicationSchema,
  emptyApplication,
  stepSchemas,
  type ApplicationFormValues,
  type SubmitApplicationResult,
} from '../../shared/schemas/application'
import { PROGRAMME_SLUGS } from '../../shared/catalog'
import { fieldErrors, HONEYPOT_FIELD } from '../../shared/validation'
import { usePageMeta } from '../lib/seo'
import { postJson, ApiError } from '../lib/api'
import {
  clearDraft,
  isDraftEmpty,
  loadDraft,
  newSubmissionId,
  saveDraft,
  savePaymentSession,
} from '../lib/applicationDraft'
import { site } from '../config/site'
import { programmes } from '../config/programmes'
import { Container } from '../components/ui/Container'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { ErrorSummary, Honeypot } from '../components/forms/Field'
import { StepIndicator } from '../components/apply/StepIndicator'
import { EducationStep, PersonalStep, ProfessionalStep, ProgrammeStep, ReviewStep } from '../components/apply/StepFields'
import { FIELD_STEP, STEPS, type FieldBinder } from '../components/apply/steps'

const stepSchemaList = [stepSchemas.personal, stepSchemas.programme, stepSchemas.education, stepSchemas.professional, stepSchemas.review]

type SubmitState = 'idle' | 'submitting' | 'error' | 'duplicate'

export default function Apply() {
  usePageMeta({
    title: 'Application form',
    path: '/apply',
    description:
      "Apply online to the Centre for Safety Education, FUPRE, for the Professional Diploma, Postgraduate Diploma, Master's or Ph.D. in Health, Environment, Safety and Security.",
  })

  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // Restore any draft saved in this browser tab
  const initialDraft = useMemo(() => loadDraft(), [])
  const [values, setValues] = useState<ApplicationFormValues>(initialDraft?.values ?? emptyApplication)
  const [maxStep, setMaxStep] = useState(initialDraft?.maxStep ?? 1)
  const [submissionId, setSubmissionId] = useState(initialDraft?.submissionId ?? newSubmissionId())
  const [restored, setRestored] = useState(Boolean(initialDraft && !isDraftEmpty(initialDraft.values)))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState('')
  const [reminderSent, setReminderSent] = useState(false)
  const submittedRef = useRef(false)

  const summaryRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const formTopRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // Current step comes from ?step=, clamped to steps the applicant has reached
  const requested = Number(params.get('step'))
  const step = Math.min(Math.max(Number.isFinite(requested) && requested > 0 ? requested : 1, 1), maxStep, 5)

  // Preselect programme from ?programme= (e.g. from a programme page), without overriding a draft choice
  useEffect(() => {
    const slug = params.get('programme')
    if (slug && (PROGRAMME_SLUGS as readonly string[]).includes(slug) && !values.programme) {
      setValues((v) => ({ ...v, programme: slug }))
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist draft to sessionStorage
  useEffect(() => {
    if (submittedRef.current) return
    if (isDraftEmpty(values) && maxStep === 1) return
    saveDraft({ values, maxStep, submissionId })
  }, [values, maxStep, submissionId])

  // Warn before closing/reloading the tab with unsaved-to-server progress
  useEffect(() => {
    const dirty = !isDraftEmpty(values)
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [values])

  // Move focus to the step heading whenever the step changes
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    formTopRef.current?.scrollIntoView({ block: 'start' })
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  const goTo = useCallback(
    (n: number) => {
      setErrors({})
      setSubmitError('')
      setRestored(false)
      setParams({ step: String(n) })
    },
    [setParams],
  )

  const field: FieldBinder = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    set: (value) => {
      setValues((v) => ({ ...v, [name]: value }))
      setErrors((er) => (er[name] ? { ...er, [name]: '' } : er))
    },
  })

  function showErrors(errs: Record<string, string>) {
    setErrors(errs)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  function validateStep(n: number): boolean {
    const result = stepSchemaList[n - 1].safeParse(values)
    if (result.success) return true
    showErrors(fieldErrors(result.error))
    return false
  }

  function handleContinue() {
    if (!validateStep(step)) return
    const returningToReview = maxStep >= 5 && step < 5
    const next = returningToReview ? 5 : step + 1
    setMaxStep((m) => Math.max(m, next))
    goTo(next)
  }

  async function handleSubmit() {
    if (submitState === 'submitting') return
    const full = applicationSchema.safeParse(values)
    if (!full.success) {
      const errs = fieldErrors(full.error)
      const earliest = Math.min(...Object.keys(errs).map((k) => FIELD_STEP[k as keyof ApplicationFormValues] ?? 5))
      if (earliest < 5) {
        goTo(earliest)
        requestAnimationFrame(() => showErrors(errs))
      } else {
        showErrors(errs)
      }
      return
    }

    setSubmitState('submitting')
    setSubmitError('')
    try {
      const result = await postJson<SubmitApplicationResult>('/api/applications', {
        ...values,
        submissionId,
        [HONEYPOT_FIELD]: honeypot,
      })
      if (result.status === 'duplicate') {
        setReminderSent(result.reminderSent)
        setSubmitState('duplicate')
        return
      }
      submittedRef.current = true
      clearDraft()
      savePaymentSession({ applicationId: result.applicationId, resumeToken: result.resumeToken })
      navigate('/payment', { replace: true, state: { applicationId: result.applicationId, resumeToken: result.resumeToken } })
    } catch (err) {
      setSubmitState('error')
      if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length) {
        showErrors(err.fieldErrors)
      } else {
        setSubmitError(
          `We could not submit your application at this time. Your answers are still saved in this browser tab. Please try again, or contact admissions at ${site.contact.email}.`,
        )
      }
    }
  }

  function startOver() {
    if (!window.confirm('Clear all answers and start a new application?')) return
    clearDraft()
    setValues(emptyApplication)
    setMaxStep(1)
    setSubmissionId(newSubmissionId())
    setRestored(false)
    setSubmitState('idle')
    goTo(1)
  }

  const current = STEPS[step - 1]
  const selectedProgramme = programmes.find((p) => p.slug === values.programme)

  return (
    <>
      <div className="border-b border-rule bg-paper">
        <Container className="py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Admissions', to: '/admissions' }, { label: 'Application form' }]} />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[2.25rem] font-semibold text-green-950 sm:text-[2.75rem]">Application Form</h1>
              <p className="mt-1 text-slate">
                {site.centre.name}, {site.institution.shortName}
                {selectedProgramme ? <span className="text-muted"> — {selectedProgramme.shortTitle}</span> : null}
              </p>
            </div>
            <p className="flex items-center gap-2 text-[0.9375rem] text-slate">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-green-700" />
              Secure submission
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <div ref={formTopRef} className="scroll-mt-24">
          <StepIndicator current={step} maxReached={maxStep} onSelect={goTo} />
        </div>

        {restored ? (
          <div className="mt-6 flex flex-col gap-3 border-l-4 border-green-800 bg-green-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.9375rem]">
              <strong>Welcome back.</strong> Your answers from earlier in this browser tab have been restored.
            </p>
            <div className="flex shrink-0 gap-4 text-[0.9375rem]">
              <button type="button" onClick={() => setRestored(false)} className="link">
                Dismiss
              </button>
              <button type="button" onClick={startOver} className="inline-flex items-center gap-1.5 font-semibold text-danger underline underline-offset-4">
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Start again
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <form
            noValidate
            className="relative lg:col-span-8"
            onSubmit={(e) => {
              e.preventDefault()
              if (step === 5) void handleSubmit()
              else handleContinue()
            }}
          >
            <div className="border border-rule border-t-4 border-t-green-800 bg-white p-5 sm:p-8">
              <h2 ref={headingRef} tabIndex={-1} className="text-[1.875rem] font-semibold text-green-950 outline-none sm:text-[2.125rem]">
                {current.title}
              </h2>
              {step < 5 ? <p className="mt-1 text-[0.9375rem] text-muted">All fields are required unless marked optional.</p> : null}

              <div className="mt-6 space-y-6">
                <ErrorSummary errors={errors} labels={applicationLabels} summaryRef={summaryRef} />

                {submitState === 'duplicate' ? (
                  <div role="alert" className="border-l-4 border-gold bg-caution-bg px-5 py-4">
                    <p className="font-display text-xl font-semibold text-ink">An application associated with this email already exists.</p>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed">
                      {reminderSent
                        ? 'The Application ID has been sent to the email address on that application. '
                        : ''}
                      If payment for that application has not been completed, you can continue it using your Application ID and
                      the same email address. If you no longer have your Application ID, contact admissions.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 xs:flex-row">
                      <Link to="/payment" className="inline-flex min-h-11 items-center justify-center bg-green-800 px-4 font-display font-semibold text-white hover:bg-green-950">
                        Continue payment
                      </Link>
                      <Link to="/contact?topic=Application%20or%20payment" className="inline-flex min-h-11 items-center justify-center border border-green-800 px-4 font-display font-semibold text-green-800 hover:bg-green-50">
                        Contact admissions
                      </Link>
                    </div>
                  </div>
                ) : null}

                {submitError ? (
                  <div role="alert" className="border-l-4 border-danger bg-danger-bg px-5 py-4 text-[0.9375rem] leading-relaxed">
                    {submitError}
                  </div>
                ) : null}

                {step === 1 ? <PersonalStep field={field} values={values} /> : null}
                {step === 2 ? <ProgrammeStep field={field} values={values} /> : null}
                {step === 3 ? <EducationStep field={field} values={values} /> : null}
                {step === 4 ? <ProfessionalStep field={field} values={values} /> : null}
                {step === 5 ? <ReviewStep field={field} values={values} onEdit={goTo} /> : null}
              </div>

              {step === 5 ? <Honeypot name={HONEYPOT_FIELD} value={honeypot} onChange={setHoneypot} /> : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius)] border border-rule-strong bg-white px-5 font-display text-[1.0625rem] font-semibold text-charcoal hover:border-slate"
                >
                  Back
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius)] bg-green-800 px-6 font-display text-[1.0625rem] font-semibold text-white hover:bg-green-950 disabled:cursor-wait disabled:opacity-70"
              >
                {step < 5
                  ? maxStep >= 5
                    ? 'Save & return to review'
                    : 'Save & Continue'
                  : submitState === 'submitting'
                    ? 'Submitting application…'
                    : 'Submit Application & Continue to Payment'}
              </button>
            </div>
          </form>

          <aside className="space-y-6 lg:col-span-4">
            <div className="border border-rule bg-paper p-6">
              <h2 className="font-display text-xl font-semibold text-green-950">Before you start</h2>
              <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-relaxed text-slate">
                <li>Your answers are kept in this browser tab as you go, so a page reload will not lose them.</li>
                <li>Closing the tab before you submit clears your answers.</li>
                <li>You can review and edit everything before submitting.</li>
                <li>After you submit, you receive an Application ID and continue to payment.</li>
              </ul>
            </div>
            <div className="border border-rule p-6">
              <h2 className="font-display text-xl font-semibold text-green-950">Need help?</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate">
                Email{' '}
                <a href={`mailto:${site.contact.email}`} className="link">
                  {site.contact.email}
                </a>{' '}
                or call{' '}
                <a href={`tel:${site.contact.phones[0].tel}`} className="link">
                  {site.contact.phones[0].display}
                </a>
                .
              </p>
              <p className="mt-3 text-[0.9375rem]">
                <Link to="/payment" className="link">
                  Already applied? Continue a payment
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}
