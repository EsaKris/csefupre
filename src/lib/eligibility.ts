import type { Programme } from '../config/programmes'

/**
 * Non-blocking notice when a stated qualification clearly does not match the
 * published entry requirement. It never prevents submission: the Centre
 * assesses every application against its official requirements.
 */
export function requirementWarning(programme: Programme | undefined, qualification: string, grade: string): string | null {
  if (!programme || !qualification || qualification === 'Other') return null
  const low = ["O'Level (WAEC, NECO or NABTEB)", 'OND / National Diploma']
  let mismatch = false

  switch (programme.slug) {
    case 'pgd':
      mismatch = low.includes(qualification)
      break
    case 'masters':
      if ([...low, 'Higher National Diploma (HND)'].includes(qualification)) mismatch = true
      if (qualification === "Bachelor's degree" && ['Third Class', 'Pass'].includes(grade)) {
        mismatch = true
      }
      break
    case 'phd':
      mismatch = !["Master's degree", 'Doctorate'].includes(qualification)
      break
    default:
      mismatch = false
  }

  if (!mismatch) return null
  const req = programme.requirements.items
    .map((item) => item.replace(/\.$/, ''))
    .map((item) => item.charAt(0).toLowerCase() + item.slice(1))
    .join(', or ')
  return `The published entry requirement for the ${programme.shortTitle} is ${req}. You can still submit your application — the Centre assesses every application against its official requirements.`
}
