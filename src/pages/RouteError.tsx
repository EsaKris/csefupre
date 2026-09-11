import { isRouteErrorResponse, useRouteError } from 'react-router'
import NotFound from './NotFound'
import { site } from '../config/site'

/** Shown if a page fails to load (e.g. network drop while fetching a route chunk). */
export default function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />

  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="mx-auto max-w-[40rem] px-5 py-20">
      <h1 className="text-[2.25rem] font-semibold text-green-950">This page did not load</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate">
        Check your internet connection and reload the page. If the problem continues, contact admissions at{' '}
        <a className="link" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>
        .
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 inline-flex min-h-12 items-center bg-green-800 px-5 font-display text-lg font-semibold text-white hover:bg-green-950"
      >
        Reload page
      </button>
    </div>
  )
}
