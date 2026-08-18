import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
  compact?: boolean
}) {
  let action: ReactNode = null
  if (actionLabel && actionTo) {
    action = (
      <Link to={actionTo} className="mt-3 inline-block text-sm font-medium text-blue-600">
        {actionLabel}
      </Link>
    )
  } else if (actionLabel) {
    action = (
      <button type="button" onClick={onAction} className="mt-3 text-sm font-medium text-blue-600">
        {actionLabel}
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'rounded-2xl border border-dashed border-blue-100 text-center',
        compact ? 'px-4 py-6' : 'px-5 py-10',
      )}
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      {action}
    </motion.div>
  )
}
