import { ImageIcon } from 'lucide-react'
import type { ImageAsset } from '../../config/images'

type Props = {
  image: ImageAsset
  className?: string
  /** Set true only for the above-the-fold hero image */
  priority?: boolean
  /** Placeholder colour scheme */
  tone?: 'light' | 'dark'
  sizes?: string
}

/**
 * Renders the configured image, or a labelled placeholder frame
 * when no file has been supplied yet (see src/config/images.ts).
 */
export function ImageFrame({ image, className = '', priority = false, tone = 'light', sizes }: Props) {
  if (image.src) {
    return (
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        {...(priority ? { fetchPriority: 'high' as const } : {})}
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }

  const toneClass =
    tone === 'dark'
      ? 'bg-green-950 text-green-100 border-white/15'
      : 'bg-paper text-slate border-rule-strong'

  return (
    <div
      role="img"
      aria-label={`${image.alt} (image to be supplied)`}
      className={`relative flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed p-6 text-center ${toneClass} ${className}`}
    >
      <ImageIcon aria-hidden="true" className="h-7 w-7 opacity-60" strokeWidth={1.5} />
      <p className="max-w-[28ch] text-sm leading-snug">
        <span className="block font-semibold">Photograph to be supplied</span>
        <span className="mt-1 block opacity-80">{image.brief}</span>
      </p>
    </div>
  )
}
