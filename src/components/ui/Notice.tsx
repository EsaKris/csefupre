import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'

type Props = { children: ReactNode; tone?: 'caution' | 'info' | 'danger'; className?: string; title?: string }

const tones = {
  caution: { box: 'border-gold bg-caution-bg', icon: 'text-gold-ink', Icon: Info },
  info: { box: 'border-green-700 bg-green-50', icon: 'text-green-700', Icon: Info },
  danger: { box: 'border-danger bg-danger-bg', icon: 'text-danger', Icon: AlertTriangle },
}

export function Notice({ children, tone = 'caution', className = '', title }: Props) {
  const t = tones[tone]
  return (
    <div className={`flex gap-3 border-l-4 px-5 py-4 text-[0.9375rem] leading-relaxed text-ink ${t.box} ${className}`}>
      <t.Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} strokeWidth={2} />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
    </div>
  )
}
