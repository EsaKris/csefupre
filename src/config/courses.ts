/**
 * Short and professional courses.
 *
 * Titles are as supplied by CSE. `about` and `relevance` describe the SUBJECT
 * in general terms — they are not the Centre's official course outline.
 * Duration, dates, fees, certification and outlines are not published until
 * the Centre supplies them; the Courses page marks them as pending.
 */

import type { CourseSlug } from '../../shared/catalog'
import { COURSE_FEES } from '../../shared/fees'

export type CourseCategory =
  | 'Management systems and standards'
  | 'Site and operational safety'
  | 'Safety leadership'
  | 'Investigation and emergency response'

export type Course = {
  slug: CourseSlug
  title: string
  abbreviation?: string
  category: CourseCategory
  /** General description of the subject */
  about: string
  /** Who typically benefits from training in this subject */
  relevance: string
  /** Official outline supplied by the Centre — null until available */
  officialOutline: string | null
}

export const courseCategories: CourseCategory[] = [
  'Management systems and standards',
  'Site and operational safety',
  'Safety leadership',
  'Investigation and emergency response',
]

export const courses: Course[] = [
  {
    slug: 'ims',
    abbreviation: 'IMS',
    title: 'Integrated Management Systems',
    category: 'Management systems and standards',
    about:
      'Integrated management systems bring quality, environmental and occupational health and safety management together in a single framework, commonly based on ISO 9001, ISO 14001 and ISO 45001.',
    relevance: 'Management system coordinators, HSE and quality personnel, and internal auditors.',
    officialOutline: null,
  },
  {
    slug: 'iso-9001',
    title: 'ISO 9001',
    category: 'Management systems and standards',
    about: 'ISO 9001 is the international standard for quality management systems.',
    relevance: 'Quality officers, process owners and personnel involved in certification or internal audits.',
    officialOutline: null,
  },
  {
    slug: 'iso-14001',
    title: 'ISO 14001',
    category: 'Management systems and standards',
    about: 'ISO 14001 is the international standard for environmental management systems.',
    relevance: 'Environmental officers, HSE personnel and organisations managing environmental compliance.',
    officialOutline: null,
  },
  {
    slug: 'iso-45001',
    abbreviation: 'OHSMS',
    title: 'ISO 45001',
    category: 'Management systems and standards',
    about:
      'ISO 45001 is the international standard for occupational health and safety management systems (OHSMS).',
    relevance: 'Health and safety officers, HSE managers and personnel implementing or auditing an OHSMS.',
    officialOutline: null,
  },
  {
    slug: 'competent-person',
    title: 'Competent Person Courses',
    category: 'Site and operational safety',
    about:
      'Competent person training prepares individuals who are designated to carry out, inspect or supervise specific safety-critical work.',
    relevance: 'Supervisors and technical personnel assigned inspection or supervisory responsibilities.',
    officialOutline: null,
  },
  {
    slug: 'defensive-driving',
    title: 'Defensive Driving',
    category: 'Site and operational safety',
    about: 'Defensive driving covers techniques and attitudes that reduce the risk of road traffic incidents.',
    relevance: 'Drivers, fleet personnel and staff who travel as part of their work.',
    officialOutline: null,
  },
  {
    slug: 'h2s-safety',
    title: 'H₂S Safety',
    category: 'Site and operational safety',
    about:
      'Hydrogen sulphide (H₂S) is a toxic gas encountered in oil and gas and other industrial operations. H₂S safety training addresses its hazards, detection, protection and emergency response.',
    relevance: 'Personnel working at or visiting sites where H₂S may be present.',
    officialOutline: null,
  },
  {
    slug: 'confined-space-entry',
    title: 'Confined Space Entry',
    category: 'Site and operational safety',
    about:
      'Confined space entry addresses the hazards of working inside tanks, vessels, pits and similar enclosed spaces, and the controls needed before and during entry.',
    relevance: 'Maintenance, inspection and operations personnel who enter or supervise work in confined spaces.',
    officialOutline: null,
  },
  {
    slug: 'safety-managers-workshop',
    title: 'Safety Managers Workshop',
    category: 'Safety leadership',
    about: 'A workshop for personnel who hold, or are moving into, responsibility for managing safety.',
    relevance: 'Safety managers, HSE leads and supervisors with safety management duties.',
    officialOutline: null,
  },
  {
    slug: 'safety-officers-course',
    title: 'Safety Officers Course',
    category: 'Safety leadership',
    about: 'A course for personnel who carry out, or are preparing to carry out, the duties of a safety officer.',
    relevance: 'Current and prospective safety officers.',
    officialOutline: null,
  },
  {
    slug: 'incident-accident-investigation',
    title: 'Incident & Accident Investigation',
    category: 'Investigation and emergency response',
    about:
      'Incident and accident investigation covers how to gather evidence, establish root causes and recommend actions that prevent recurrence.',
    relevance: 'HSE personnel, supervisors and members of investigation teams.',
    officialOutline: null,
  },
  {
    slug: 'oil-spill-contingency-response',
    title: 'Oil Spill Contingency Response',
    category: 'Investigation and emergency response',
    about: 'Oil spill contingency response covers planning for, and responding to, oil spill incidents.',
    relevance: 'Emergency response teams, environmental personnel and oil and gas operations staff.',
    officialOutline: null,
  },
]

export function courseLabel(c: Course): string {
  if (!c.abbreviation) return c.title
  return `${c.title} (${c.abbreviation})`
}

export function getCourse(slug: string | null | undefined): Course | undefined {
  return slug ? courses.find((c) => c.slug === slug) : undefined
}

/** Confirmed fee in Naira, or null while awaiting confirmation (see shared/fees.ts) */
export function courseFee(c: Course): number | null {
  return COURSE_FEES[c.slug]
}
