import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { TopBar } from './TopBar'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="text-muted">Loading page…</span>
    </div>
  )
}

export function SiteLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
      >
        Skip to main content
      </a>
      <TopBar />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
