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
    src: '/assets/images/hero.jpg',
    alt: 'CSE-trained safety officers securing equipment during a field exercise',
    brief: 'CSE field training exercise — people in PPE at an industrial or field site. Portrait or 4:5 crop.',
    width: 600,
    height: 454,
  },
  homeAbout: {
    src: '/assets/images/homeabout.jpg',
    alt: 'Safety officer holding a hard hat, ready for site work',
    brief: 'Safety briefing in progress — instructor addressing participants.',
    width: 800,
    height: 444,
  },
  homePractical: {
    src: '/assets/images/student.jpg',
    alt: 'Practical safety training at an industrial facility',
    brief: 'Practical training — inspection, PPE demonstration or equipment check.',
  },
  homeCareers: {
    src: '/assets/images/carrer.jpg',
    alt: 'Centre for Safety Education graduate wearing personal protective equipment',
    brief: 'CSE graduate in PPE on site.',
    width: 679,
    height: 450,
  },
  aboutHeader: {
    src: '/assets/images/fupretet.jpg',
    alt: 'Federal University of Petroleum Resources, Effurun campus',
    brief: 'FUPRE campus or the Old TETFund Building.',
    width: 276,
    height: 183,
  },
  programmesHeader: {
    src: '/assets/images/homeabout.jpg',
    alt: 'Classroom session at the Centre for Safety Education',
    brief: 'Classroom or lecture session at CSE.',
  },
  coursesHeader: {
    src: '/assets/images/book.jpg',
    alt: 'Participants in a professional safety course',
    brief: 'Short-course participants — e.g. H₂S or confined space training.',
    width: 678,
    height: 452,
  },
  careersHeader: {
    src: '/assets/images/carrer.jpg',
    alt: 'Safety officer conducting a site inspection',
    brief: 'Safety officer conducting an inspection with a checklist.',
  },
  contactHeader: {
    src: '/assets/images/contact.jpg',
    alt: 'Old TETFund Building, Federal University of Petroleum Resources',
    brief: 'Exterior of the Old TETFund Building, FUPRE.',
    width: 201,
    height: 148,
  },
} satisfies Record<string, ImageAsset>
