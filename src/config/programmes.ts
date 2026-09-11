/**
 * Programme data.
 *
 * Summaries and requirements are as supplied by CSE. Detail sections are
 * written only from that supplied material. Anything not officially supplied
 * (modules, objectives, Ph.D. duration, research themes) is `null`, and the
 * pages render a visible placeholder in its place.
 */

import type { ProgrammeSlug } from '../../shared/catalog'

export type { ProgrammeSlug }

export type Programme = {
  slug: ProgrammeSlug
  path: string
  /** Order in the academic progression (diploma → doctorate) */
  level: 1 | 2 | 3 | 4
  shortTitle: string
  abbreviation?: string
  title: string
  field: string
  /** Months. `null` when not officially supplied (Ph.D.) */
  durationMonths: number | null
  summary: string
  /** Condensed entry requirement for compact displays (derived from `requirements`) */
  entryShort: string
  /** When `alternatives` is true, any one item satisfies the requirement. */
  requirements: { items: string[]; alternatives: boolean }
  /** Who the programme is intended for */
  audience: string
  /** Areas the programme addresses, as named in the supplied description */
  focus: string[]
  /** How the programme relates to careers, research or leadership */
  relevance: string
  /** Official objectives — null until supplied by the Centre */
  objectives: string[] | null
  /** Official module list — null until supplied by the Centre */
  modules: string[] | null
}

export const FIELD = 'Health, Environment, Safety and Security'

export const programmes: Programme[] = [
  {
    slug: 'professional-diploma',
    path: '/programmes/professional-diploma',
    level: 1,
    shortTitle: 'Professional Diploma',
    title: 'Professional Diploma in Health, Environment, Safety and Security',
    field: FIELD,
    durationMonths: 12,
    summary:
      'A comprehensive programme for individuals seeking professional competence in occupational health, safety, environmental protection, and security.',
    entryShort: "Five O'Level credits",
    requirements: {
      items: ["Five (5) O'Level credit passes including Mathematics and English."],
      alternatives: false,
    },
    audience:
      "Individuals seeking professional competence in occupational health, safety, environmental protection, and security, who meet the O'Level entry requirement.",
    focus: ['Occupational health', 'Safety', 'Environmental protection', 'Security'],
    relevance:
      "The programme builds professional competence for work in health, safety, environment and security, and is the first level of the Centre's progression from diploma to doctorate.",
    objectives: null,
    modules: null,
  },
  {
    slug: 'pgd',
    path: '/programmes/pgd',
    level: 2,
    shortTitle: 'Postgraduate Diploma',
    abbreviation: 'PGD',
    title: 'Postgraduate Diploma in Health, Environment, Safety and Security',
    field: FIELD,
    durationMonths: 12,
    summary: 'Designed for graduates wishing to develop advanced professional skills in HSE Management.',
    entryShort: "Bachelor's degree or HND",
    requirements: {
      items: [
        "A Bachelor's Degree",
        'A Higher National Diploma (HND) from a recognized tertiary institution',
      ],
      alternatives: true,
    },
    audience:
      "Holders of a Bachelor's degree or HND who wish to develop advanced professional skills in HSE management.",
    focus: ['HSE management', 'Health', 'Environment', 'Safety', 'Security'],
    relevance:
      "The PGD develops advanced professional skills in HSE management. An acceptable PGD is also one of the entry routes into the Master's programme.",
    objectives: null,
    modules: null,
  },
  {
    slug: 'masters',
    path: '/programmes/masters',
    level: 3,
    shortTitle: "Master's Degree",
    title: "Master's Degree in Health, Environment, Safety and Security",
    field: FIELD,
    durationMonths: 18,
    summary:
      'An advanced programme for professionals seeking leadership positions in HSE management, policy, and research.',
    entryShort: "Bachelor's (2:2 minimum) or PGD",
    requirements: {
      items: [
        "A Bachelor's Degree with a minimum of Second Class (Lower Division)",
        'An acceptable Postgraduate Diploma (PGD)',
      ],
      alternatives: true,
    },
    audience: 'Professionals seeking leadership positions in HSE management, policy, and research.',
    focus: ['HSE management', 'Policy', 'Research'],
    relevance:
      "The programme is intended for professionals preparing for leadership in HSE management and policy, and for those developing research capability. A Master's degree in Health, Environment, Safety or a related discipline is the entry requirement for the Ph.D.",
    objectives: null,
    modules: null,
  },
  {
    slug: 'phd',
    path: '/programmes/phd',
    level: 4,
    shortTitle: 'Doctor of Philosophy',
    abbreviation: 'Ph.D.',
    title: 'Doctor of Philosophy in Health, Environment, Safety and Security',
    field: FIELD,
    durationMonths: null,
    summary:
      'For candidates seeking advanced research and academic specialization in Health, Environment, Safety, and Security.',
    entryShort: "Master's degree",
    requirements: {
      items: ["A Master's Degree in Health, Environment, Safety, or a related discipline."],
      alternatives: false,
    },
    audience:
      "Holders of a Master's degree in Health, Environment, Safety or a related discipline who are seeking advanced research and academic specialization.",
    focus: ['Health', 'Environment', 'Safety', 'Security'],
    relevance:
      "The Ph.D. is the highest level of the Centre's programmes, oriented toward advanced research and academic specialization in Health, Environment, Safety and Security.",
    objectives: null,
    modules: null,
  },
]

export const REQUIREMENTS_NOTICE =
  'Applicants should confirm the latest official admission requirements with the Centre before submitting an application.'

export function formatDuration(p: Programme): string {
  return p.durationMonths ? `${p.durationMonths} months` : 'Research programme'
}

export function displayName(p: Programme): string {
  return p.abbreviation && p.abbreviation !== 'Ph.D.' ? `${p.shortTitle} (${p.abbreviation})` : p.shortTitle
}

export function getProgramme(slug: ProgrammeSlug): Programme {
  const found = programmes.find((p) => p.slug === slug)
  if (!found) throw new Error(`Unknown programme: ${slug}`)
  return found
}
