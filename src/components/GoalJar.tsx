import { motion } from 'motion/react'
import { CategoryIcon } from '@/utils/categoryIcons'
import { formatCurrency } from '@/utils/currency'
import { cn } from '@/lib/utils'
import type { Goal } from '@/types'
import type { ReactNode } from 'react'

export function GoalJar({
  goal,
  currency,
  compact = false,
  onClick,
}: {
  goal: Goal
  currency: string
  compact?: boolean
  onClick?: () => void
}) {
  const percent = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0
  const complete = percent >= 100
  const className = cn(
    'flex flex-col items-center rounded-3xl border border-blue-100 bg-white p-4 text-center',
    compact ? 'gap-2' : 'gap-3',
    onClick && 'hover:border-blue-300',
  )

  const body: ReactNode = (
    <>
      <div className={cn('relative', compact ? 'h-28 w-20' : 'h-36 w-24')}>
        <div className="absolute top-0 right-[18%] left-[18%] h-3 rounded-t-md bg-blue-200" />
        <div className="absolute top-2 right-[8%] left-[8%] h-[12%] rounded-t-lg border-x-4 border-t-4 border-blue-200 bg-white" />
        <div className="absolute inset-x-0 top-[18%] bottom-0 overflow-hidden rounded-b-[2.2rem] rounded-t-lg border-4 border-blue-200 bg-blue-50">
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={false}
            animate={{ height: `${percent}%` }}
            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
            style={{ backgroundColor: goal.color }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'rounded-full bg-white/85 p-2 shadow-sm',
                complete ? 'text-blue-700' : 'text-slate-600',
              )}
            >
              <CategoryIcon name={goal.icon} className={compact ? 'size-5' : 'size-6'} />
            </span>
          </div>
        </div>
      </div>
      <div className="w-full">
        <p className="truncate font-semibold text-slate-900">{goal.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatCurrency(goal.currentAmount, currency)}
          <span className="text-slate-400">
            {' '}
            / {formatCurrency(goal.targetAmount, currency)}
          </span>
        </p>
        <p className="mt-1 text-xs font-medium text-blue-700">
          {complete ? 'Goal reached' : `${Math.round(percent)}% full`}
        </p>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label={`${goal.name}, ${complete ? 'goal reached' : `${Math.round(percent)}% full`}, ${formatCurrency(goal.currentAmount, currency)} of ${formatCurrency(goal.targetAmount, currency)}`}
      >
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}
