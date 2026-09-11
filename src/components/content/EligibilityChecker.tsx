import { useId, useState } from 'react'
import { Link } from 'react-router'
import { getProgramme, type ProgrammeSlug } from '../../config/programmes'
import { site } from '../../config/site'

/**
 * Indicative eligibility guide.
 * Mapping follows ONLY the published entry requirements. It does not make
 * admission decisions and says so. Where requirements do not address a
 * qualification, the applicant is directed to the Centre.
 */

type Option = { value: string; label: string; matches: ProgrammeSlug[]; note?: string }

const options: Option[] = [
  { value: 'olevel-5', label: "O'Level: five or more credits, including Mathematics and English", matches: ['professional-diploma'] },
  {
    value: 'olevel-less',
    label: "O'Level: fewer than five credits, or without Mathematics or English",
    matches: [],
    note: "The published requirement for the Professional Diploma is five O'Level credit passes including Mathematics and English.",
  },
  { value: 'hnd', label: 'Higher National Diploma (HND)', matches: ['pgd'] },
  { value: 'bsc-2-2', label: "Bachelor's degree: Second Class (Lower Division) or higher", matches: ['pgd', 'masters'] },
  { value: 'bsc-below', label: "Bachelor's degree: Third Class or Pass", matches: ['pgd'] },
  { value: 'pgd', label: 'Postgraduate Diploma (PGD)', matches: ['masters'], note: "The Master's requirement refers to an acceptable PGD. The Centre confirms whether a PGD is acceptable." },
  { value: 'msc-related', label: "Master's degree in Health, Environment, Safety, or a related discipline", matches: ['phd'] },
  {
    value: 'msc-other',
    label: "Master's degree in an unrelated discipline",
    matches: [],
    note: "The published Ph.D. requirement is a Master's degree in Health, Environment, Safety, or a related discipline.",
  },
]

export function EligibilityChecker() {
  const [value, setValue] = useState('')
  const selectId = useId()
  const selected = options.find((o) => o.value === value)

  return (
    <div className="border border-rule border-t-4 border-t-green-800 bg-white p-6 sm:p-8">
      <h2 className="text-[1.75rem] font-semibold text-green-950">Which programme matches your qualification?</h2>
      <p className="mt-2 text-slate">An indicative guide based on the published entry requirements.</p>

      <label htmlFor={selectId} className="mt-6 block font-semibold">
        Your highest qualification
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mt-2 block w-full rounded-[var(--radius)] border border-rule-strong bg-white px-3.5 py-3 text-[1.0625rem] focus:border-green-800 focus:outline-none focus:ring-3 focus:ring-gold/60"
      >
        <option value="">Select your qualification</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div aria-live="polite" className="mt-6">
        {selected ? (
          <div className="border-l-4 border-green-800 bg-green-50 px-5 py-4">
            {selected.matches.length > 0 ? (
              <>
                <p className="font-semibold">Based on the published requirements, you may be eligible for:</p>
                <ul className="mt-3 space-y-2">
                  {selected.matches.map((slug) => {
                    const p = getProgramme(slug)
                    return (
                      <li key={slug} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <Link to={p.path} className="link font-display text-xl font-semibold">
                          {p.shortTitle}
                        </Link>
                        <Link to={`/apply?programme=${slug}`} className="text-[0.9375rem] font-semibold text-green-800 underline underline-offset-4">
                          Apply for this programme
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <p className="font-semibold">The published requirements do not directly cover this qualification.</p>
            )}
            {selected.note ? <p className="mt-3 text-[0.9375rem] text-slate">{selected.note}</p> : null}
            <p className="mt-3 text-[0.9375rem] text-slate">
              This guide does not decide admission. Confirm your eligibility with the Centre at{' '}
              <a href={`mailto:${site.contact.email}`} className="link">
                {site.contact.email}
              </a>
              .
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
