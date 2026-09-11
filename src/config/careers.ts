/**
 * Career paths. Descriptions are general descriptions of each role —
 * not claims about CSE graduate outcomes.
 */

export type CareerPath = { title: string; description: string; note?: string }

export const careers: CareerPath[] = [
  {
    title: 'Health & Safety Officer',
    description:
      'Monitors workplace conditions and practices, supports compliance with health and safety requirements, and helps investigate incidents.',
  },
  {
    title: 'HSE Manager',
    description:
      'Leads the health, safety and environment function, sets policies and programmes, and reports on HSE performance to management.',
  },
  {
    title: 'Environmental Consultant',
    description: 'Advises organisations on environmental impact, environmental compliance and environmental management systems.',
  },
  {
    title: 'Safety Auditor',
    description:
      'Assesses whether safety management systems and site practices meet internal standards and external requirements.',
  },
  {
    title: 'Risk Management Consultant',
    description: 'Identifies and assesses operational and workplace risks, and advises on controls to reduce them.',
  },
  {
    title: 'Industrial Safety Specialist',
    description:
      'Focuses on hazards in industrial operations such as process plants, manufacturing facilities and oil and gas installations.',
  },
  {
    title: 'Safety Compliance Officer',
    description:
      'Tracks adherence to regulations, permits and procedures, and maintains the records that demonstrate compliance.',
  },
  {
    title: 'Occupational Health Practitioner',
    description:
      "Works to protect workers' health from hazards arising at work, including exposure monitoring and health surveillance.",
    note: 'Some occupational health roles also require clinical qualifications or professional registration.',
  },
]

export const careerPaths: string[] = careers.map((c) => c.title)

/** Used wherever careers are discussed. Keeps employment language honest. */
export const CAREERS_NOTICE =
  'CSE programmes are designed to support professional development toward roles such as these. Admission to or completion of a programme does not guarantee employment.'
