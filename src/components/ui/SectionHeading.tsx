import type { ReactNode } from 'react'

type Props = {
  id?: string
  title: string
  intro?: ReactNode
  tone?: 'light' | 'dark'
  className?: string
  as?: 'h1' | 'h2'
}

export function SectionHeading({ id, title, intro, tone = 'light', className = '', as: Tag = 'h2' }: Props) {
  return (
    <div className={`max-w-[42rem] ${className}`}>
      <span className="section-rule" aria-hidden="true" />
      <Tag
        id={id}
        className={`text-[2rem] font-semibold sm:text-[2.5rem] ${tone === 'dark' ? 'text-white' : 'text-green-950'}`}
      >
        {title}
      </Tag>
      {intro ? (
        <div className={`mt-4 text-lg leading-relaxed ${tone === 'dark' ? 'text-green-100' : 'text-slate'}`}>{intro}</div>
      ) : null}
    </div>
  )
}
