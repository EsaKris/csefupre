import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ChevronDown, Menu, X } from 'lucide-react'
import { primaryNav } from '../../config/navigation'
import { programmes, formatDuration } from '../../config/programmes'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { BrandLockup } from './BrandLockup'

const linkBase =
  'relative inline-flex h-full items-center px-3 font-display text-[1.0625rem] font-medium text-charcoal hover:text-green-800'
const activeMark =
  'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-gold text-green-900'

function ProgrammesMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { pathname } = useLocation()
  const active = pathname.startsWith('/programmes')

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative h-full">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`${linkBase} gap-1 ${active ? activeMark : ''}`}
      >
        Programmes
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-50 w-[22rem] border border-rule border-t-4 border-t-green-800 bg-white shadow-[0_12px_32px_-12px_rgba(14,59,37,0.35)]"
      >
        <ul className="py-2">
          {programmes.map((p) => (
            <li key={p.slug}>
              <Link
                to={p.path}
                className="flex items-baseline justify-between gap-4 px-5 py-3 hover:bg-green-50 focus-visible:bg-green-50"
              >
                <span className="font-display text-[1.0625rem] font-semibold text-green-950">{p.shortTitle}</span>
                <span className="shrink-0 text-sm text-muted">{formatDuration(p)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-rule px-5 py-3">
          <Link to="/programmes" className="link text-[0.9375rem] font-semibold">
            Compare all programmes
          </Link>
        </div>
      </div>
    </div>
  )
}

function MobileMenu({ open, onClose, id }: { open: boolean; onClose: () => void; id: string }) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstLinkRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const item = ({ isActive }: { isActive: boolean }) =>
    `block border-l-4 py-3 pl-4 font-display text-xl font-semibold ${
      isActive ? 'border-gold text-green-900 bg-green-50' : 'border-transparent text-charcoal'
    }`

  return (
    <div id={id} hidden={!open} className="fixed inset-x-0 bottom-0 top-[var(--header-h,4.5rem)] z-40 overflow-y-auto bg-white lg:hidden">
      <Container className="py-6">
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            <li>
              <NavLink ref={firstLinkRef} to="/about" className={item}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/programmes" end className={item}>
                Programmes
              </NavLink>
              <ul className="mb-2 ml-4 border-l border-rule">
                {programmes.map((p) => (
                  <li key={p.slug}>
                    <NavLink
                      to={p.path}
                      className={({ isActive }) =>
                        `flex justify-between gap-3 py-2.5 pl-5 pr-2 text-[1.0625rem] ${isActive ? 'font-semibold text-green-900' : 'text-slate'}`
                      }
                    >
                      <span>{p.shortTitle}</span>
                      <span className="text-sm text-muted">{formatDuration(p)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            {primaryNav
              .filter((n) => n.to !== '/about' && n.to !== '/programmes')
              .map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to} className={item}>
                    {n.label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
        <div className="mt-8 grid gap-3 border-t border-rule pt-6">
          <ButtonLink to="/apply">Apply Now</ButtonLink>
          <ButtonLink to="/brochure" variant="secondary">
            Download Brochure
          </ButtonLink>
          <ButtonLink to="/payment" variant="plain" className="justify-start">
            Continue an incomplete payment
          </ButtonLink>
        </div>
      </Container>
    </div>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const mobileId = useId()

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Expose header height so the mobile panel sits directly beneath it
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () => document.documentElement.style.setProperty('--header-h', `${el.getBoundingClientRect().bottom}px`)
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [mobileOpen])

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b bg-white transition-shadow print:hidden ${
        scrolled ? 'border-rule shadow-[0_6px_20px_-14px_rgba(31,37,34,0.45)]' : 'border-rule'
      }`}
    >
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <BrandLockup />

        <nav aria-label="Main" className="hidden h-full lg:block">
          <ul className="flex h-full items-stretch">
            {primaryNav.map((n) =>
              n.to === '/programmes' ? (
                <li key={n.to} className="h-full">
                  <ProgrammesMenu />
                </li>
              ) : (
                <li key={n.to} className="h-full">
                  <NavLink to={n.to} className={({ isActive }) => `${linkBase} ${isActive ? activeMark : ''}`}>
                    {n.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink to="/apply" className="!min-h-11 !py-2.5 max-sm:!hidden">
            Apply Now
          </ButtonLink>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 border border-rule-strong px-3 font-display text-base font-semibold text-green-950 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls={mobileId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            <span className="max-xs:sr-only">{mobileOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </Container>
      <MobileMenu id={mobileId} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}
