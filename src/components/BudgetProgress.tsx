import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currency'

export function BudgetProgress({
  label,
  spent,
  limit,
  currency,
  tone = 'blue',
}: {
  label: string
  spent: number
  limit: number
  currency: string
  tone?: 'blue' | 'category'
}) {
  const ratio = limit > 0 ? spent / limit : 0
  const percent = Math.min(100, ratio * 100)
  const remaining = limit - spent
  const over = remaining < 0
  const barClass = over
    ? 'bg-red-500'
    : ratio >= 0.8
      ? 'bg-amber-500'
      : tone === 'blue'
        ? 'bg-blue-600'
        : 'bg-blue-500'

  return (
    <article className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <p className="min-w-0 truncate font-medium text-slate-900">{label}</p>
        <p className="shrink-0 text-sm text-slate-500">
          {formatCurrency(spent, currency)}
          <span className="text-slate-400"> / {formatCurrency(limit, currency)}</span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.round(spent * 100) / 100}
        aria-valuetext={
          over
            ? `${formatCurrency(Math.abs(remaining), currency)} over budget`
            : `${formatCurrency(remaining, currency)} left`
        }
        className="h-2 overflow-hidden rounded-full bg-blue-50"
      >
        <div
          className={cn('h-full rounded-full transition-[width]', barClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={cn('text-xs', over ? 'font-medium text-red-600' : 'text-slate-500')}>
        {over
          ? `${formatCurrency(Math.abs(remaining), currency)} over budget`
          : `${formatCurrency(remaining, currency)} left`}
      </p>
    </article>
  )
}
