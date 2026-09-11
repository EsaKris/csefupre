/**
 * Stable identifiers shared by the browser and the server.
 * These slugs are stored in Google Sheets and used for fee lookup,
 * so do not rename one once applications have been recorded.
 */

export const PROGRAMME_SLUGS = ['professional-diploma', 'pgd', 'masters', 'phd'] as const
export type ProgrammeSlug = (typeof PROGRAMME_SLUGS)[number]

/** Human-readable programme names for server-side use (Sheets, emails) */
export const PROGRAMME_NAMES: Record<ProgrammeSlug, string> = {
  'professional-diploma': 'Professional Diploma in Health, Environment, Safety and Security',
  pgd: 'Postgraduate Diploma in Health, Environment, Safety and Security',
  masters: "Master's Degree in Health, Environment, Safety and Security",
  phd: 'Doctor of Philosophy in Health, Environment, Safety and Security',
}

export const COURSE_SLUGS = [
  'ims',
  'iso-9001',
  'iso-14001',
  'iso-45001',
  'competent-person',
  'defensive-driving',
  'h2s-safety',
  'confined-space-entry',
  'safety-managers-workshop',
  'safety-officers-course',
  'incident-accident-investigation',
  'oil-spill-contingency-response',
] as const
export type CourseSlug = (typeof COURSE_SLUGS)[number]

/** Readable course titles for server-side use (Sheets, emails) */
export const COURSE_TITLES: Record<CourseSlug, string> = {
  ims: 'Integrated Management Systems (IMS)',
  'iso-9001': 'ISO 9001',
  'iso-14001': 'ISO 14001',
  'iso-45001': 'ISO 45001 (OHSMS)',
  'competent-person': 'Competent Person Courses',
  'defensive-driving': 'Defensive Driving',
  'h2s-safety': 'H₂S Safety',
  'confined-space-entry': 'Confined Space Entry',
  'safety-managers-workshop': 'Safety Managers Workshop',
  'safety-officers-course': 'Safety Officers Course',
  'incident-accident-investigation': 'Incident & Accident Investigation',
  'oil-spill-contingency-response': 'Oil Spill Contingency Response',
}
