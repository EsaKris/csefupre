/**
 * Central institutional configuration.
 * Edit contact details, names and links here — not inside components.
 *
 * NOTE: The application fee is NOT defined here. It will live in
 * /shared/fees.ts (Phase 5) so the server-side payment function reads
 * the authoritative amount. The browser never decides it.
 */

export const site = {
  institution: {
    name: 'Federal University of Petroleum Resources, Effurun',
    shortName: 'FUPRE',
    website: 'https://fupre.edu.ng',
  },

  centre: {
    name: 'Centre for Safety Education',
    shortName: 'CSE',
    fullName: 'Centre for Safety Education, Federal University of Petroleum Resources, Effurun',
  },

  /** Final domain is supplied later. Set VITE_SITE_URL in Vercel. */
  url: (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, ''),

  contact: {
    email: 'cse@fupre.edu.ng',
    phones: [
      { display: '0802 848 7246', tel: '+2348028487246' },
      { display: '0703 594 1999', tel: '+2347035941999' },
    ],
    address: ['Old TETFund Building', 'Federal University of Petroleum Resources (FUPRE)'],
    website: {
      display: 'fupre.edu.ng/center-for-safety-education',
      href: 'https://fupre.edu.ng/center-for-safety-education',
    },
    /** Google Maps embed URL for the contact page. Leave empty until the location is confirmed. */
    mapEmbedUrl: '',
  },

  admissions: {
    /** Controls the "applications are open" wording across the site. */
    applicationsOpen: true,
    /** Official admission deadline. Leave empty until confirmed — never guess. */
    deadline: '',
  },

  /** Path to the official brochure PDF once supplied, e.g. '/assets/documents/cse-brochure.pdf' */
  brochureUrl: '',

  /** Official social media profiles only. Leave empty rather than inventing links. */
  social: [] as { label: string; href: string }[],

  copyright: '© 2026 Centre for Safety Education, FUPRE. All rights reserved.',
} as const
