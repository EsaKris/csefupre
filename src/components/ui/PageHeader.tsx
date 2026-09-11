import type { ReactNode } from 'react'
import { Container } from './Container'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import { ImageFrame } from './ImageFrame'
import type { ImageAsset } from '../../config/images'

type Props = {
  title: string
  intro?: ReactNode
  crumbs: Crumb[]
  /** Optional header photograph shown beside the title on wide screens */
  image?: ImageAsset
  /** Extra content under the intro (facts, buttons) */
  children?: ReactNode
  /** Compact variant for utility pages (legal, status pages) */
  compact?: boolean
}

/** Inner-page header: breadcrumbs, H1 and intro on institutional green. */
export function PageHeader({ title, intro, crumbs, image, children, compact = false }: Props) {
  return (
    <header className="border-b-4 border-gold bg-green-900 text-white">
      <Container className={`grid gap-10 ${image ? 'lg:grid-cols-12 lg:items-end' : ''} ${compact ? 'py-9 sm:py-11' : 'py-10 sm:py-14'}`}>
        <div className={image ? 'lg:col-span-7 lg:pb-2' : ''}>
          <Breadcrumbs items={crumbs} tone="dark" />
          <h1 className={`mt-6 max-w-[24ch] font-semibold ${compact ? 'text-[2.25rem] sm:text-[2.75rem]' : 'text-[2.375rem] sm:text-[3.25rem]'}`}>
            {title}
          </h1>
          {intro ? <div className="mt-4 max-w-[40rem] text-lg leading-relaxed text-green-100">{intro}</div> : null}
          {children}
        </div>
        {image ? (
          <div className="hidden lg:col-span-5 lg:block">
            <div className="aspect-[16/10] w-full">
              <ImageFrame image={image} tone="dark" priority sizes="40vw" />
            </div>
          </div>
        ) : null}
      </Container>
    </header>
  )
}
