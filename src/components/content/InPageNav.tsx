export type InPageLink = { id: string; label: string }

/** "On this page" list for long documents. Sticky on wide screens. */
export function InPageNav({ links }: { links: InPageLink[] }) {
  return (
    <nav aria-label="On this page" className="border-l-2 border-green-800 pl-5 lg:sticky lg:top-24">
      <p className="font-display text-lg font-semibold text-green-950">On this page</p>
      <ol className="mt-3 space-y-2 text-[0.9375rem]">
        {links.map((l) => (
          <li key={l.id}>
            <a href={`#${l.id}`} className="text-slate underline-offset-4 hover:text-green-800 hover:underline">
              {l.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
