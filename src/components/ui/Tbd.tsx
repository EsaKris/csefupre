import type { ReactNode } from 'react'

/**
 * Marks content awaiting institutional confirmation.
 * Rendered visibly on purpose so placeholders are never published unnoticed.
 * Search the codebase for <Tbd> before launch.
 */
export function Tbd({ children }: { children: ReactNode }) {
  return (
    <mark className="tbd" title="Placeholder — awaiting confirmation from the Centre">
      {children}
    </mark>
  )
}
