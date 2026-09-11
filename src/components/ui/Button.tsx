import { Link } from 'react-router'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'onDark' | 'onDarkOutline' | 'plain'

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] px-5 py-3 font-display text-[1.0625rem] font-semibold leading-none tracking-[0.01em] transition-colors duration-150 min-h-12 text-center'

const variants: Record<Variant, string> = {
  primary: 'bg-green-800 text-white hover:bg-green-950',
  secondary: 'border border-green-800 text-green-800 hover:bg-green-50',
  onDark: 'bg-gold text-ink hover:bg-gold-soft',
  onDarkOutline: 'border border-white/60 text-white hover:bg-white/10 hover:border-white',
  plain: 'px-0 text-green-800 underline underline-offset-4 decoration-1 hover:decoration-2',
}

type CommonProps = { children: ReactNode; variant?: Variant; className?: string }

/** Internal route button */
export function ButtonLink({ to, children, variant = 'primary', className = '' }: CommonProps & { to: string }) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  )
}

/** External, mailto: or tel: link styled as a button */
export function ButtonAnchor({
  href,
  children,
  variant = 'primary',
  className = '',
}: CommonProps & { href: string }) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
