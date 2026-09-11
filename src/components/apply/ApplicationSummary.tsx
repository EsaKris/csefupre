import type { ApplicationFormValues } from '../../../shared/schemas/application'
import { EMPLOYED, isOLevel } from '../../../shared/schemas/application'
import { programmes } from '../../config/programmes'

type Row = { label: string; value: string }

function formatDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function summarySections(v: ApplicationFormValues): { step: number; title: string; rows: Row[] }[] {
  const programme = programmes.find((p) => p.slug === v.programme)
  const employed = EMPLOYED.includes(v.employmentStatus)
  return [
    {
      step: 1,
      title: 'Personal information',
      rows: [
        { label: 'Name', value: `${v.firstName} ${v.lastName}`.trim() },
        { label: 'Email address', value: v.email },
        { label: 'Phone number', value: v.phone },
        { label: 'Date of birth', value: formatDate(v.dateOfBirth) },
        { label: 'Gender', value: v.gender },
        { label: 'Country of residence', value: v.country },
        { label: v.country === 'Nigeria' ? 'State' : 'State or region', value: v.state },
        { label: 'Address', value: v.address },
      ],
    },
    {
      step: 2,
      title: 'Programme',
      rows: [
        { label: 'Programme', value: programme?.title ?? '' },
        { label: 'Duration', value: programme?.durationMonths ? `${programme.durationMonths} months` : programme ? 'To be confirmed by the Centre' : '' },
      ],
    },
    {
      step: 3,
      title: 'Educational background',
      rows: [
        { label: 'Highest qualification', value: v.highestQualification },
        { label: 'Institution', value: v.institution },
        ...(isOLevel(v.highestQualification) ? [] : [{ label: 'Course of study', value: v.courseOfStudy }]),
        { label: 'Year completed', value: v.graduationYear },
        { label: 'Grade or classification', value: v.grade },
      ],
    },
    {
      step: 4,
      title: 'Professional and application details',
      rows: [
        { label: 'Employment status', value: v.employmentStatus },
        ...(employed
          ? [
              { label: 'Organisation', value: v.organization },
              { label: 'Job title', value: v.jobTitle },
            ]
          : []),
        { label: 'Years of experience', value: v.yearsExperience },
        { label: 'Reason for applying', value: v.applicationReason },
        { label: 'How you heard about the Centre', value: v.referralSource },
        { label: 'Preferred contact method', value: v.preferredContact },
      ],
    },
  ]
}

type Props = { values: ApplicationFormValues; onEdit?: (step: number) => void }

/** Read-only application summary. Reused on the confirmation page in Phase 5. */
export function ApplicationSummary({ values, onEdit }: Props) {
  return (
    <div className="space-y-6">
      {summarySections(values).map((section) => (
        <section key={section.step} aria-labelledby={`summary-${section.step}`} className="border border-rule bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-rule bg-paper px-5 py-3">
            <h3 id={`summary-${section.step}`} className="text-[1.25rem] font-semibold text-green-950">
              {section.title}
            </h3>
            {onEdit ? (
              <button type="button" onClick={() => onEdit(section.step)} className="link text-[0.9375rem] font-semibold print:hidden">
                Edit<span className="sr-only"> {section.title.toLowerCase()}</span>
              </button>
            ) : null}
          </div>
          <dl className="divide-y divide-rule px-5">
            {section.rows.map((r) => (
              <div key={r.label} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                <dt className="text-[0.9375rem] text-muted">{r.label}</dt>
                <dd className="whitespace-pre-line break-words text-[1.0625rem]">
                  {r.value || <span className="text-muted">Not provided</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
