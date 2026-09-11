export type NavItem = { label: string; to: string }

export const primaryNav: NavItem[] = [
  { label: 'About', to: '/about' },
  { label: 'Programmes', to: '/programmes' },
  { label: 'Admissions', to: '/admissions' },
  { label: 'Courses', to: '/courses' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact', to: '/contact' },
]

export const footerQuickLinks: NavItem[] = [
  { label: 'About', to: '/about' },
  { label: 'Programmes', to: '/programmes' },
  { label: 'Admissions', to: '/admissions' },
  { label: 'Courses', to: '/courses' },
  { label: 'Careers', to: '/careers' },
  { label: 'Apply', to: '/apply' },
  { label: 'Contact', to: '/contact' },
]

export const footerResourceLinks: NavItem[] = [
  { label: 'Frequently asked questions', to: '/faq' },
  { label: 'Admission brochure', to: '/brochure' },
  { label: 'Continue a payment', to: '/payment' },
]

export const legalLinks: NavItem[] = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms', to: '/terms' },
]
