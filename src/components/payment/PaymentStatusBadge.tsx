const styles: Record<string, string> = {
  Success: 'bg-green-800 text-white',
  Pending: 'bg-caution-bg text-gold-ink border border-gold',
  Ongoing: 'bg-caution-bg text-gold-ink border border-gold',
  Processing: 'bg-caution-bg text-gold-ink border border-gold',
  Queued: 'bg-caution-bg text-gold-ink border border-gold',
  'Not Started': 'bg-paper text-slate border border-rule-strong',
  Abandoned: 'bg-danger-bg text-danger border border-danger/40',
  Failed: 'bg-danger-bg text-danger border border-danger/40',
  Reversed: 'bg-danger-bg text-danger border border-danger/40',
}

const labels: Record<string, string> = {
  Success: 'Paid',
  'Not Started': 'Awaiting payment',
  Pending: 'Awaiting payment',
  Ongoing: 'Payment in progress',
  Processing: 'Being confirmed',
  Queued: 'Being confirmed',
  Abandoned: 'Not completed',
  Failed: 'Failed',
  Reversed: 'Reversed',
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-sm font-semibold ${styles[status] ?? styles['Not Started']}`}>
      {labels[status] ?? status}
    </span>
  )
}
