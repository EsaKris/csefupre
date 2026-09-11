import { Link } from 'react-router'
import { logos } from '../../config/images'
import { site } from '../../config/site'
import { LogoMark } from '../ui/LogoMark'

export function BrandLockup({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark'
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label={`${site.centre.name}, ${site.institution.shortName} — home`}>
      <LogoMark logo={logos.fupre} placeholderText="FUPRE" tone={tone} className="h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12" />
      <span className="min-w-0 leading-none">
        <span className={`block font-display text-[0.9375rem] font-bold tracking-[0.04em] ${dark ? 'text-gold-soft' : 'text-green-700'}`}>
          {site.institution.shortName}
        </span>
        <span className={`mt-1 block font-display text-[1.0625rem] font-semibold leading-[1.1] sm:text-[1.25rem] ${dark ? 'text-white' : 'text-green-950'}`}>
          {site.centre.name}
        </span>
      </span>
    </Link>
  )
}
