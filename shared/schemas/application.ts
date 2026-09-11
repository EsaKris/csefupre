/**
 * Application form schema — shared by the wizard (per-step feedback) and
 * /api/applications (authoritative validation, Phase 4).
 *
 * Allowed-value lists here are the ONLY accepted values. The server rejects
 * anything else, whatever the browser sends.
 */
import { z } from 'zod'
import { PROGRAMME_SLUGS } from '../catalog.js'
import { COUNTRIES } from '../data/countries.js'
import { NIGERIAN_STATES } from '../data/nigerianStates.js'
import { cleanText, email, phone, text } from '../validation.js'

/* ── Allowed values ─────────────────────────────────────────── */

export const GENDERS = ['Female', 'Male', 'Prefer not to say'] as const

export const QUALIFICATIONS = [
  "O'Level (WAEC, NECO or NABTEB)",
  'OND / National Diploma',
  'Higher National Diploma (HND)',
  "Bachelor's degree",
  'Postgraduate Diploma (PGD)',
  "Master's degree",
  'Doctorate',
  'Other',
] as const
export type Qualification = (typeof QUALIFICATIONS)[number]

export const DEGREE_CLASSES = [
  'First Class',
  'Second Class (Upper Division)',
  'Second Class (Lower Division)',
  'Third Class',
  'Pass',
] as const

export const HND_GRADES = ['Distinction', 'Upper Credit', 'Lower Credit', 'Pass'] as const

export const EMPLOYMENT_STATUSES = [
  'Employed full-time',
  'Employed part-time',
  'Self-employed',
  'Not currently employed',
  'Student',
] as const

export const EXPERIENCE_RANGES = [
  'No work experience',
  'Less than 1 year',
  '1 to 2 years',
  '3 to 5 years',
  '6 to 10 years',
  'More than 10 years',
] as const

export const REFERRAL_SOURCES = [
  'FUPRE website',
  'Social media',
  'Friend or colleague',
  'Employer',
  'ISPON',
  'Search engine',
  'Event or seminar',
  'Other',
] as const

export const CONTACT_METHODS = ['Email', 'Phone call', 'WhatsApp', 'SMS'] as const

/* ── Helpers ────────────────────────────────────────────────── */

export const EMPLOYED: readonly string[] = ['Employed full-time', 'Employed part-time', 'Self-employed']

export function needsDegreeClass(q: string) {
  return q === "Bachelor's degree"
}
export function needsHndGrade(q: string) {
  return q === 'Higher National Diploma (HND)'
}
export function isOLevel(q: string) {
  return q === "O'Level (WAEC, NECO or NABTEB)"
}

function isPlausibleDob(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return false
  const now = new Date()
  const tenYearsAgo = new Date(Date.UTC(now.getUTCFullYear() - 10, now.getUTCMonth(), now.getUTCDate()))
  return d.getUTCFullYear() >= 1920 && d <= tenYearsAgo
}

const optionalText = (max: number) => z.string().default('').transform(cleanText).pipe(z.string().max(max, { error: `Must be ${max} characters or fewer` }))

/* ── Step shapes ────────────────────────────────────────────── */

export const personalShape = {
  firstName: text('first name', { max: 60 }),
  lastName: text('last name', { max: 60 }),
  email,
  phone,
  dateOfBirth: z.string({ error: 'Enter your date of birth' }).refine(isPlausibleDob, { error: 'Enter a valid date of birth' }),
  gender: z.enum(GENDERS, { error: 'Select an option' }),
  country: z.enum(COUNTRIES, { error: 'Select your country of residence' }),
  state: text('state or region', { max: 100 }),
  address: text('address', { min: 5, max: 300 }),
}

export const programmeShape = {
  programme: z.enum(PROGRAMME_SLUGS, { error: 'Choose the programme you are applying for' }),
}

export const educationShape = {
  highestQualification: z.enum(QUALIFICATIONS, { error: 'Select your highest qualification' }),
  institution: text('institution', { min: 2, max: 150 }),
  courseOfStudy: optionalText(150),
  graduationYear: z.string({ error: 'Enter the year you completed this qualification' }).trim(),
  grade: text('grade or classification', { max: 80 }),
}

export const professionalShape = {
  employmentStatus: z.enum(EMPLOYMENT_STATUSES, { error: 'Select your employment status' }),
  organization: optionalText(150),
  jobTitle: optionalText(100),
  yearsExperience: z.enum(EXPERIENCE_RANGES, { error: 'Select your years of experience' }),
  applicationReason: text('reason for applying', { min: 20, max: 1500 }),
  referralSource: z.enum(REFERRAL_SOURCES, { error: 'Tell us how you heard about the Centre' }),
  preferredContact: z.enum(CONTACT_METHODS, { error: 'Choose how you would like to be contacted' }),
}

export const consentShape = {
  acceptPrivacy: z.literal(true, { error: 'Confirm that you have read the Privacy Policy' }),
  acceptTerms: z.literal(true, { error: 'Confirm that you accept the application terms' }),
  confirmAccuracy: z.literal(true, { error: 'Confirm that the information you provided is accurate' }),
}

/* ── Cross-field rules ──────────────────────────────────────── */

type Ctx = z.RefinementCtx

function refinePersonal(v: { country?: string; state?: string }, ctx: Ctx) {
  if (v.country === 'Nigeria' && v.state && !(NIGERIAN_STATES as readonly string[]).includes(v.state)) {
    ctx.addIssue({ code: 'custom', path: ['state'], message: 'Select your state' })
  }
}

function refineEducation(
  v: { highestQualification?: string; courseOfStudy?: string; graduationYear?: string; grade?: string },
  ctx: Ctx,
) {
  const q = v.highestQualification ?? ''
  const year = Number(v.graduationYear)
  const thisYear = new Date().getFullYear()
  if (!/^\d{4}$/.test(v.graduationYear ?? '') || year < 1950 || year > thisYear) {
    ctx.addIssue({ code: 'custom', path: ['graduationYear'], message: `Enter a year between 1950 and ${thisYear}` })
  }
  if (q && !isOLevel(q) && !v.courseOfStudy) {
    ctx.addIssue({ code: 'custom', path: ['courseOfStudy'], message: 'Enter your course of study' })
  }
  if (needsDegreeClass(q) && !(DEGREE_CLASSES as readonly string[]).includes(v.grade ?? '')) {
    ctx.addIssue({ code: 'custom', path: ['grade'], message: 'Select your degree classification' })
  }
  if (needsHndGrade(q) && !(HND_GRADES as readonly string[]).includes(v.grade ?? '')) {
    ctx.addIssue({ code: 'custom', path: ['grade'], message: 'Select your HND grade' })
  }
}

function refineProfessional(v: { employmentStatus?: string; organization?: string; jobTitle?: string }, ctx: Ctx) {
  if (v.employmentStatus && EMPLOYED.includes(v.employmentStatus)) {
    if (!v.organization) ctx.addIssue({ code: 'custom', path: ['organization'], message: 'Enter your organisation' })
    if (!v.jobTitle) ctx.addIssue({ code: 'custom', path: ['jobTitle'], message: 'Enter your job title' })
  }
}

/* ── Schemas ────────────────────────────────────────────────── */

/**
 * Run cross-field rules even when other fields are invalid, so applicants see
 * every problem at once. (Zod 4 otherwise skips object refinements after an
 * enum failure.) The refine functions tolerate missing values.
 */
const ALWAYS = { when: () => true }

export const stepSchemas = {
  personal: z.object(personalShape).superRefine(refinePersonal, ALWAYS),
  programme: z.object(programmeShape),
  education: z.object(educationShape).superRefine(refineEducation, ALWAYS),
  professional: z.object(professionalShape).superRefine(refineProfessional, ALWAYS),
  review: z.object(consentShape),
}

/** Full application — what /api/applications validates */
export const applicationSchema = z
  .object({ ...personalShape, ...programmeShape, ...educationShape, ...professionalShape, ...consentShape })
  .superRefine((v, ctx) => {
    refinePersonal(v, ctx)
    refineEducation(v, ctx)
    refineProfessional(v, ctx)
  }, ALWAYS)

export type Application = z.output<typeof applicationSchema>

/** Form state in the browser: everything as strings/booleans */
export type ApplicationFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  country: string
  state: string
  address: string
  programme: string
  highestQualification: string
  institution: string
  courseOfStudy: string
  graduationYear: string
  grade: string
  employmentStatus: string
  organization: string
  jobTitle: string
  yearsExperience: string
  applicationReason: string
  referralSource: string
  preferredContact: string
  acceptPrivacy: boolean
  acceptTerms: boolean
  confirmAccuracy: boolean
}

export const emptyApplication: ApplicationFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  country: 'Nigeria',
  state: '',
  address: '',
  programme: '',
  highestQualification: '',
  institution: '',
  courseOfStudy: '',
  graduationYear: '',
  grade: '',
  employmentStatus: '',
  organization: '',
  jobTitle: '',
  yearsExperience: '',
  applicationReason: '',
  referralSource: '',
  preferredContact: '',
  acceptPrivacy: false,
  acceptTerms: false,
  confirmAccuracy: false,
}

/** Field labels, used by error summaries and the review screen */
export const applicationLabels: Record<keyof ApplicationFormValues, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  phone: 'Phone number',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  country: 'Country of residence',
  state: 'State or region',
  address: 'Address',
  programme: 'Programme',
  highestQualification: 'Highest qualification',
  institution: 'Institution',
  courseOfStudy: 'Course of study',
  graduationYear: 'Year completed',
  grade: 'Grade or classification',
  employmentStatus: 'Employment status',
  organization: 'Organisation',
  jobTitle: 'Job title',
  yearsExperience: 'Years of experience',
  applicationReason: 'Reason for applying',
  referralSource: 'How you heard about the Centre',
  preferredContact: 'Preferred contact method',
  acceptPrivacy: 'Privacy Policy',
  acceptTerms: 'Application terms',
  confirmAccuracy: 'Accuracy of information',
}

/* ── API contract (implemented in Phases 4–5) ───────────────── */

export type SubmitApplicationRequest = ApplicationFormValues & {
  /** Random ID created once per draft; the server uses it to ignore duplicate submits */
  submissionId: string
  companyWebsite?: string
}

export type SubmitApplicationResult =
  | {
      status: 'created'
      applicationId: string
      /** Short-lived signed token that lets the payment page load this application without exposing it in the URL */
      resumeToken: string
    }
  | {
      /** An application already exists for this email or phone. No details are returned. */
      status: 'duplicate'
      /** True when the Application ID was emailed to the address on the existing application */
      reminderSent: boolean
    }
