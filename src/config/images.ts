/**
 * Image and logo slots.
 *
 * Every image on the site is referenced from here. While `src` is empty,
 * a labelled placeholder frame is rendered in its place so missing
 * assets are obvious during review.
 *
 * To supply an asset:
 *   1. Put the file in /public/assets/images (or /public/assets/logos)
 *   2. Set `src` to its public path, e.g. '/assets/images/hero-field-training.jpg'
 *   3. Set `width` and `height` to the file's real pixel size (prevents layout shift)
 *   4. Check the `alt` text still describes the actual photograph
 *
 * Prefer official FUPRE/CSE photography. Do not use AI-generated people.
 */

export type ImageAsset = {
  src: string
  alt: string
  /** Shown inside the placeholder frame: what photograph belongs here */
  brief: string
  width?: number
  height?: number
  credit?: string
}

export const logos = {
  fupre: {
    src: '/assets/logos/fupre-logo.png',
    alt: 'Federal University of Petroleum Resources, Effurun logo',
    brief: 'FUPRE logo. Current file is 217px — replace with an SVG or PNG of at least 400px when available.',
    width: 217,
    height: 217,
  },
  ispon: {
    src: '/assets/logos/ispon-logo.png',
    alt: 'Institute of Safety Professionals of Nigeria (ISPON) logo',
    brief: 'ISPON logo',
    width: 480,
    height: 460,
  },
} satisfies Record<string, ImageAsset>

export const images = {
  homeHero: {
    src: '/assets/images/hero.png',
    alt: 'CSE-trained safety officers securing equipment during a field exercise',
    brief: 'CSE field training exercise — people in PPE at an industrial or field site. Portrait or 4:5 crop.',
    width: 600,
    height: 454,
  },
  homeAbout: {
    src: '/assets/images/homeabout.png',
    alt: 'Safety officer holding a hard hat, ready for site work',
    brief: 'Safety briefing in progress — instructor addressing participants.',
    width: 800,
    height: 444,
  },
  homePractical: {
    src: '/assets/images/student.png',
    alt: 'Practical safety training at an industrial facility',
    brief: 'Practical training — inspection, PPE demonstration or equipment check.',
  },
  homeCareers: {
    src: '/assets/images/carrer.png',
    alt: 'Centre for Safety Education graduate wearing personal protective equipment',
    brief: 'CSE graduate in PPE on site.',
  },
  aboutHeader: {
    src: '/assets/images/homeabout.png',
    alt: 'Federal University of Petroleum Resources, Effurun campus',
    brief: 'FUPRE campus or the Old TETFund Building.',
  },
  programmesHeader: {
    src: '',
    alt: 'Classroom session at the Centre for Safety Education',
    brief: 'Classroom or lecture session at CSE.',
  },
  coursesHeader: {
    src: '',
    alt: 'Participants in a professional safety course',
    brief: 'Short-course participants — e.g. H₂S or confined space training.',
  },
  careersHeader: {
    src: '',
    alt: 'Safety officer conducting a site inspection',
    brief: 'Safety officer conducting an inspection with a checklist.',
  },
  contactHeader: {
    src: '',
    alt: 'Old TETFund Building, Federal University of Petroleum Resources',
    brief: 'Exterior of the Old TETFund Building, FUPRE.',
  },
} satisfies Record<string, ImageAsset>
