import type { ImageAsset } from '../../config/images'

type Props = {
  logo: ImageAsset
  /** Short text shown inside the placeholder, e.g. "FUPRE" */
  placeholderText: string
  className?: string
  tone?: 'light' | 'dark'
}

/**
 * Logo slot. Renders the supplied logo file, or a sized placeholder box.
 * On dark backgrounds the logo sits on a white tile, because the FUPRE and ISPON
 * marks use black and dark red that would be lost against institutional green.
 */
export function LogoMark({ logo, placeholderText, className = 'h-12 w-12', tone = 'light' }: Props) {
  if (logo.src) {
    const img = (
      <img
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        decoding="async"
        className="h-full w-full object-contain"
      />
    )
    return tone === 'dark' ? (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] bg-white p-1.5 ${className}`}>{img}</span>
    ) : (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>{img}</span>
    )
  }

  const toneClass = tone === 'dark' ? 'border-white/40 text-white/80' : 'border-green-700/50 text-green-800'
  return (
    <span
      role="img"
      aria-label={`${logo.alt} (to be supplied)`}
      title={logo.brief}
      className={`inline-flex shrink-0 items-center justify-center border border-dashed text-center font-display text-[0.625rem] font-semibold leading-tight ${toneClass} ${className}`}
    >
      {placeholderText}
      <br />
      logo
    </span>
  )
}
