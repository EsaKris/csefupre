import { Link } from 'react-router'
import {
  CONTACT_METHODS,
  DEGREE_CLASSES,
  EMPLOYED,
  EMPLOYMENT_STATUSES,
  EXPERIENCE_RANGES,
  GENDERS,
  HND_GRADES,
  QUALIFICATIONS,
  REFERRAL_SOURCES,
  isOLevel,
  needsDegreeClass,
  needsHndGrade,
  type ApplicationFormValues,
} from '../../../shared/schemas/application'
import { COUNTRIES } from '../../../shared/data/countries'
import { NIGERIAN_STATES } from '../../../shared/data/nigerianStates'
import { APPLICATION_FEES } from '../../../shared/fees'
import { Fee } from '../ui/Fee'
import { programmes, formatDuration, FIELD } from '../../config/programmes'
import { requirementWarning } from '../../lib/eligibility'
import { FormCheckbox, FormInput, FormRadioGroup, FormSelect, FormTextarea } from '../forms/Field'
import { Notice } from '../ui/Notice'
import { RequirementList } from '../content/RequirementCard'
import { ApplicationSummary } from './ApplicationSummary'
import type { FieldBinder } from './steps'

type StepProps = { field: FieldBinder; values: ApplicationFormValues }

const today = () => new Date().toISOString().slice(0, 10)

/* Step 1 ─ Personal information */
export function PersonalStep({ field, values }: StepProps) {
  const f = field
  const inNigeria = values.country === 'Nigeria'
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormInput label="First name" autoComplete="given-name" maxLength={60} {...bindText(f('firstName'))} />
        <FormInput label="Last name" autoComplete="family-name" maxLength={60} {...bindText(f('lastName'))} />
      </div>
      <FormInput
        label="Email address"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={254}
        hint="Your Application ID and payment updates are sent here."
        {...bindText(f('email'))}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormInput
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={24}
          hint="For example 0802 848 7246 or +234 802 848 7246"
          {...bindText(f('phone'))}
        />
        <FormInput label="Date of birth" type="date" autoComplete="bday" max={today()} min="1920-01-01" {...bindText(f('dateOfBirth'))} />
      </div>
      <FormRadioGroup legend="Gender" options={GENDERS} {...bindChoice(f('gender'))} />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormSelect
          label="Country of residence"
          autoComplete="country-name"
          options={COUNTRIES}
          placeholder="Select country"
          name="country"
          value={values.country}
          error={f('country').error}
          onChange={(e) => {
            const next = e.target.value
            f('country').set(next)
            // A Nigerian state is not valid for another country, and vice versa
            if ((next === 'Nigeria') !== inNigeria) f('state').set('')
          }}
        />
        {inNigeria ? (
          <FormSelect label="State" options={NIGERIAN_STATES} placeholder="Select state" {...bindText(f('state'))} />
        ) : (
          <FormInput label="State or region" autoComplete="address-level1" maxLength={100} {...bindText(f('state'))} />
        )}
      </div>
      <FormTextarea label="Residential address" autoComplete="street-address" maxLength={300} rows={3} className="[&_textarea]:min-h-24" {...bindText(f('address'))} />
    </div>
  )
}

/* Step 2 ─ Programme */
export function ProgrammeStep({ field }: StepProps) {
  const pf = field('programme')
  return (
    <fieldset aria-describedby={pf.error ? 'programme-error' : undefined}>
      <legend className="font-semibold text-ink">Which programme are you applying for?</legend>
      <p className="mt-1 text-[0.9375rem] text-muted">All programmes are in {FIELD}.</p>
      <div className="mt-4 grid gap-3">
        {programmes.map((p) => (
          <label
            key={p.slug}
            className={`grid cursor-pointer gap-x-4 gap-y-2 rounded-[var(--radius)] border bg-white p-5 has-[:checked]:border-green-800 has-[:checked]:bg-green-50 has-[:checked]:shadow-[inset_4px_0_0_0_var(--color-green-800)] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-gold/60 sm:grid-cols-[auto_1fr_auto] ${
              pf.error ? 'border-danger' : 'border-rule-strong hover:border-slate'
            }`}
          >
            <input
              type="radio"
              name="programme"
              value={p.slug}
              checked={pf.value === p.slug}
              onChange={() => pf.set(p.slug)}
              className="mt-1 h-5 w-5 accent-green-800"
            />
            <span>
              <span className="block font-display text-[1.375rem] font-semibold leading-tight text-green-950">{p.shortTitle}</span>
              <span className="mt-1 block text-[0.9375rem] text-slate">Entry: {p.entryShort}</span>
            </span>
            <span className="text-[0.9375rem] text-muted sm:text-right">
              Level {p.level}
              <span className="block">{formatDuration(p)}</span>
            </span>
          </label>
        ))}
      </div>
      {pf.error ? (
        <p id="programme-error" className="mt-2 text-[0.9375rem] font-semibold text-danger">
          ! {pf.error}
        </p>
      ) : null}
      <p className="mt-5 text-[0.9375rem]">
        Not sure which programme fits?{' '}
        <Link to="/requirements" target="_blank" className="link">
          Check the requirements guide (opens in a new tab)
        </Link>
      </p>
    </fieldset>
  )
}

/* Step 3 ─ Education */
export function EducationStep({ field, values }: StepProps) {
  const f = field
  const q = values.highestQualification
  const programme = programmes.find((p) => p.slug === values.programme)
  const warning = requirementWarning(programme, q, values.grade)
  const thisYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      {programme ? (
        <div className="border-l-4 border-green-800 bg-green-50 px-5 py-4 text-[0.9375rem]">
          <p className="font-semibold">Entry requirement for the {programme.shortTitle}</p>
          <div className="mt-1.5">
            <RequirementList programme={programme} />
          </div>
        </div>
      ) : null}

      <FormSelect
        label="Highest qualification"
        options={QUALIFICATIONS}
        placeholder="Select qualification"
        name="highestQualification"
        value={q}
        error={f('highestQualification').error}
        onChange={(e) => {
          const next = e.target.value
          f('highestQualification').set(next)
          // Clear a grade that belongs to a different qualification type
          const wasList = needsDegreeClass(q) || needsHndGrade(q)
          const isList = needsDegreeClass(next) || needsHndGrade(next)
          if (wasList || isList) f('grade').set('')
          if (isOLevel(next)) f('courseOfStudy').set('')
        }}
      />

      {q ? (
        <>
          <FormInput
            label={isOLevel(q) ? 'School' : 'Institution'}
            autoComplete="organization"
            maxLength={150}
            {...bindText(f('institution'))}
          />
          {isOLevel(q) ? null : <FormInput label="Course of study" maxLength={150} {...bindText(f('courseOfStudy'))} />}
          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <FormInput
              label="Year completed"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              hint={`Four digits, for example ${thisYear - 3}`}
              {...bindText(f('graduationYear'))}
            />
            {needsDegreeClass(q) ? (
              <FormSelect label="Degree classification" options={DEGREE_CLASSES} placeholder="Select classification" {...bindText(f('grade'))} />
            ) : needsHndGrade(q) ? (
              <FormSelect label="HND grade" options={HND_GRADES} placeholder="Select grade" {...bindText(f('grade'))} />
            ) : (
              <FormInput
                label="Grade or classification"
                maxLength={80}
                hint={isOLevel(q) ? 'For example: 6 credits including Mathematics and English' : undefined}
                {...bindText(f('grade'))}
              />
            )}
          </div>
        </>
      ) : null}

      {warning ? <Notice tone="caution">{warning}</Notice> : null}
    </div>
  )
}

/* Step 4 ─ Professional and application details */
export function ProfessionalStep({ field, values }: StepProps) {
  const f = field
  const employed = EMPLOYED.includes(values.employmentStatus)
  const reasonLength = values.applicationReason.trim().length

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="text-[1.375rem] font-semibold text-green-950">Employment</h3>
        <FormRadioGroup
          legend="Employment status"
          options={EMPLOYMENT_STATUSES}
          columns={2}
          value={values.employmentStatus}
          name="employmentStatus"
          error={f('employmentStatus').error}
          onChange={(next) => {
            f('employmentStatus').set(next)
            if (!EMPLOYED.includes(next)) {
              f('organization').set('')
              f('jobTitle').set('')
            }
          }}
        />
        {employed ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <FormInput label="Organisation" autoComplete="organization" maxLength={150} {...bindText(f('organization'))} />
            <FormInput label="Job title" autoComplete="organization-title" maxLength={100} {...bindText(f('jobTitle'))} />
          </div>
        ) : null}
        <FormSelect label="Years of work experience" options={EXPERIENCE_RANGES} placeholder="Select range" {...bindText(f('yearsExperience'))} />
      </div>

      <div className="space-y-6 border-t border-rule pt-8">
        <h3 className="text-[1.375rem] font-semibold text-green-950">About your application</h3>
        <FormTextarea
          label="Why are you applying?"
          maxLength={1500}
          hint={
            <>
              Briefly describe your goals for this programme. Between 20 and 1,500 characters.{' '}
              <span aria-live="polite">({reasonLength.toLocaleString()} entered)</span>
            </>
          }
          {...bindText(f('applicationReason'))}
        />
        <FormSelect label="How did you hear about the Centre?" options={REFERRAL_SOURCES} placeholder="Select an option" {...bindText(f('referralSource'))} />
        <FormRadioGroup legend="Preferred contact method" options={CONTACT_METHODS} {...bindChoice(f('preferredContact'))} />
      </div>
    </div>
  )
}

/* Step 5 ─ Review */
export function ReviewStep({ field, values, onEdit }: StepProps & { onEdit: (step: number) => void }) {
  const f = field
  const fee = values.programme ? APPLICATION_FEES[values.programme as keyof typeof APPLICATION_FEES] : null
  return (
    <div className="space-y-8">
      <p className="text-[1.0625rem] text-slate">
        Check everything below. Use <strong>Edit</strong> to change a section — you will come straight back here.
      </p>
      <ApplicationSummary values={values} onEdit={onEdit} />

      <div className="border border-rule bg-paper px-5 py-4">
        <p className="font-semibold">Application fee</p>
        <p className="mt-1 text-[1.0625rem]">
          {fee !== null && fee !== undefined ? (
            <>
              <Fee amount={fee} />
              <span className="block text-[0.9375rem] text-slate">Paid on the next step through Paystack's secure checkout.</span>
            </>
          ) : (
            <span className="text-slate">
              The application fee has not yet been published. Your application will be saved, and admissions will contact you
              about payment.
            </span>
          )}
        </p>
      </div>

      <fieldset className="space-y-4 border-t-2 border-green-900 pt-6">
        <legend className="sr-only">Declarations</legend>
        <h3 className="text-[1.375rem] font-semibold text-green-950">Declarations</h3>
        <FormCheckbox
          name="acceptPrivacy"
          checked={values.acceptPrivacy}
          onChange={(v) => f('acceptPrivacy').set(v)}
          error={f('acceptPrivacy').error}
          label={
            <>
              I have read the{' '}
              <Link to="/privacy-policy" target="_blank" className="link">
                Privacy Policy (opens in a new tab)
              </Link>{' '}
              and understand how my information will be used.
            </>
          }
        />
        <FormCheckbox
          name="acceptTerms"
          checked={values.acceptTerms}
          onChange={(v) => f('acceptTerms').set(v)}
          error={f('acceptTerms').error}
          label={
            <>
              I accept the{' '}
              <Link to="/terms" target="_blank" className="link">
                application terms (opens in a new tab)
              </Link>
              .
            </>
          }
        />
        <FormCheckbox
          name="confirmAccuracy"
          checked={values.confirmAccuracy}
          onChange={(v) => f('confirmAccuracy').set(v)}
          error={f('confirmAccuracy').error}
          label="I confirm that the information in this application is true and complete."
        />
      </fieldset>
    </div>
  )
}

/* ── binding helpers ── */

type TextBinding = { name: string; value: string; error?: string; set: (value: string) => void }

function bindText(b: TextBinding) {
  return { name: b.name, value: b.value, error: b.error, onChange: (e: { target: { value: string } }) => b.set(e.target.value) }
}

function bindChoice(b: TextBinding) {
  return { name: b.name, value: b.value, error: b.error, onChange: (v: string) => b.set(v) }
}
