import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { SiteLayout } from './components/layout/SiteLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import RouteError from './pages/RouteError'

/**
 * Route table.
 * Home is bundled eagerly for the fastest first paint. Every other page is
 * code-split and loads on demand (SiteLayout provides the Suspense fallback).
 */

const About = lazy(() => import('./pages/About'))
const Programmes = lazy(() => import('./pages/Programmes'))
const ProfessionalDiploma = lazy(() => import('./pages/programmes/ProfessionalDiploma'))
const PGD = lazy(() => import('./pages/programmes/PGD'))
const Masters = lazy(() => import('./pages/programmes/Masters'))
const PhD = lazy(() => import('./pages/programmes/PhD'))
const Admissions = lazy(() => import('./pages/Admissions'))
const Requirements = lazy(() => import('./pages/Requirements'))
const Courses = lazy(() => import('./pages/Courses'))
const Careers = lazy(() => import('./pages/Careers'))
const Contact = lazy(() => import('./pages/Contact'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Terms = lazy(() => import('./pages/Terms'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Brochure = lazy(() => import('./pages/Brochure'))
const Apply = lazy(() => import('./pages/Apply'))
const Payment = lazy(() => import('./pages/Payment'))
const PaymentStatus = lazy(() => import('./pages/PaymentStatus'))
const ApplicationSuccess = lazy(() => import('./pages/ApplicationSuccess'))
const PaymentPending = lazy(() => import('./pages/PaymentPending'))
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'))

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/programmes', element: <Programmes /> },
      { path: '/programmes/professional-diploma', element: <ProfessionalDiploma /> },
      { path: '/programmes/pgd', element: <PGD /> },
      { path: '/programmes/masters', element: <Masters /> },
      { path: '/programmes/phd', element: <PhD /> },
      { path: '/admissions', element: <Admissions /> },
      { path: '/requirements', element: <Requirements /> },
      { path: '/courses', element: <Courses /> },
      { path: '/careers', element: <Careers /> },
      { path: '/contact', element: <Contact /> },
      { path: '/privacy-policy', element: <PrivacyPolicy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/faq', element: <FAQ /> },
      { path: '/brochure', element: <Brochure /> },
      { path: '/apply', element: <Apply /> },
      { path: '/payment', element: <Payment /> },
      { path: '/payment/status', element: <PaymentStatus /> },
      { path: '/application-success', element: <ApplicationSuccess /> },
      { path: '/application-payment-pending', element: <PaymentPending /> },
      { path: '/application-payment-failed', element: <PaymentFailed /> },
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
