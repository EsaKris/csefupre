import type { ApplicationFormValues } from '../../../shared/schemas/application'

export type StepKey = 'personal' | 'programme' | 'education' | 'professional' | 'review' | 'payment'

export const STEPS: { key: StepKey; label: string; title: string }[] = [
  { key: 'personal', label: 'Personal', title: 'Personal information' },
  { key: 'programme', label: 'Programme', title: 'Programme' },
  { key: 'education', label: 'Education', title: 'Educational background' },
  { key: 'professional', label: 'Professional', title: 'Professional and application details' },
  { key: 'review', label: 'Review', title: 'Review your application' },
  { key: 'payment', label: 'Payment', title: 'Payment' },
]

/** Which wizard step owns each field (used to route review-stage errors back to the right step) */
export const FIELD_STEP: Record<keyof ApplicationFormValues, number> = {
  firstName: 1, lastName: 1, email: 1, phone: 1, dateOfBirth: 1, gender: 1, country: 1, state: 1, address: 1,
  programme: 2,
  highestQualification: 3, institution: 3, courseOfStudy: 3, graduationYear: 3, grade: 3,
  employmentStatus: 4, organization: 4, jobTitle: 4, yearsExperience: 4, applicationReason: 4, referralSource: 4, preferredContact: 4,
  acceptPrivacy: 5, acceptTerms: 5, confirmAccuracy: 5,
}

export type FieldBinder = <K extends keyof ApplicationFormValues>(
  name: K,
) => {
  name: K
  value: ApplicationFormValues[K]
  error?: string
  set: (value: ApplicationFormValues[K]) => void
}
