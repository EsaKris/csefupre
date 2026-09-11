import type { ReactNode } from 'react'

/** Section of a long-form document page (privacy, terms). */
export function DocSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24 border-t border-rule pt-8 first:border-t-0 first:pt-0">
      <h2 id={id} className="text-[1.75rem] font-semibold text-green-950">
        {title}
      </h2>
      <div className="doc-body mt-4 max-w-[42rem] text-[1.0625rem] leading-[1.7] text-ink">{children}</div>
    </section>
  )
}
