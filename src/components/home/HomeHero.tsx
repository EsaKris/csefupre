import { Link } from 'react-router'
import { homeCopy } from '../../config/home'
import { images } from '../../config/images'
import { programmes, formatDuration } from '../../config/programmes'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { ImageFrame } from '../ui/ImageFrame'

/**
 * Programme ladder: the four programmes as an ascending staircase.
 * The content is a genuine progression (diploma → doctorate), so the
 * level numbers and stepped heights encode real information.
 */
function ProgrammeLadder() {
  // Step heights (desktop): each level rises 3rem above the previous, sharing one baseline
  const lift = ['lg:min-h-[13rem]', 'lg:min-h-[16rem]', 'lg:min-h-[19rem]', 'lg:min-h-[22rem]']
  // Mobile: each level steps further in
  const indent = ['ml-0', 'ml-3 xs:ml-5', 'ml-6 xs:ml-10', 'ml-9 xs:ml-15']
  const shade = ['bg-green-800', 'bg-green-700', 'bg-green-600', 'bg-white text-green-950']

  return (
    <div aria-labelledby="ladder-heading">
      <h2 id="ladder-heading" className="sr-only">
        Programme levels
      </h2>
      <ol className="grid gap-2 lg:grid-cols-4 lg:items-end lg:gap-0">
        {programmes.map((p, i) => {
          const isTop = i === 3
          return (
            <li
              key={p.slug}
              className={`animate-step flex ${indent[i]} lg:ml-0`}
              style={{ animationDelay: `${120 + i * 110}ms` }}
            >
              <Link
                to={p.path}
                className={`group block w-full border-t-4 border-gold px-5 pb-6 pt-4 transition-colors lg:px-6 ${lift[i]} ${shade[i]} ${
                  isTop ? 'hover:bg-gold-soft' : 'text-white hover:bg-green-950'
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className={`font-display text-sm font-semibold ${isTop ? 'text-green-700' : 'text-gold-soft'}`}>
                    Level {p.level}
                  </span>
                  <span className={`text-sm ${isTop ? 'text-slate' : 'text-green-100'}`}>{formatDuration(p)}</span>
                </span>
                <span className="mt-2 block font-display text-[1.5rem] font-semibold leading-tight lg:text-[1.625rem]">
                  {p.shortTitle}
                  {p.abbreviation && p.abbreviation !== 'Ph.D.' ? ` (${p.abbreviation})` : ''}
                </span>
                <span className={`mt-2 block text-[0.9375rem] ${isTop ? 'text-slate' : 'text-green-100'}`}>
                  Entry: {p.entryShort}
                </span>
                <span
                  className={`mt-4 inline-block text-[0.9375rem] font-semibold underline decoration-1 underline-offset-4 group-hover:decoration-2 ${
                    isTop ? 'text-green-800' : 'text-white'
                  }`}
                >
                  Programme details
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function HomeHero() {
  const { hero } = homeCopy
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-green-900 text-white">
      <Container className="pt-12 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 lg:pb-8">
            <p className="font-display text-[1.0625rem] font-medium text-gold-soft">{hero.context}</p>
            <h1
              id="hero-heading"
              className="mt-5 max-w-[16ch] text-[2.75rem] font-bold leading-[1.02] tracking-[-0.01em] xs:text-[3.125rem] sm:text-[4rem] lg:text-[4.75rem]"
            >
              {hero.headline}
            </h1>
            <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-green-100 sm:text-xl">{hero.lede}</p>

            <div className="mt-9 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <ButtonLink to="/apply" variant="onDark">
                Apply Now
              </ButtonLink>
              <ButtonLink to="/programmes" variant="onDarkOutline">
                Explore Programmes
              </ButtonLink>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
              <li>
                <Link to="/brochure" className="text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                  Download admission brochure
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                  Contact admissions
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/5]">
              <ImageFrame image={images.homeHero} tone="dark" priority sizes="(min-width: 1024px) 40vw, 100vw" />
            </div>
          </div>
        </div>

        <div className="mt-12 lg:-mt-20">
          <ProgrammeLadder />
        </div>
      </Container>
      {/* Base strip anchoring the ladder to the page */}
      <div className="h-6 bg-green-950 lg:h-8" aria-hidden="true" />
    </section>
  )
}
