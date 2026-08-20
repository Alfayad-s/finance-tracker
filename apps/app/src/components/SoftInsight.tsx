import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import type { SoftInsightData } from '@/utils/insights'

export function SoftInsight({ insight }: { insight: SoftInsightData }) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5"
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-slate-800">{insight.message}</p>
        {insight.detail ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{insight.detail}</p>
        ) : null}
      </div>
    </motion.aside>
  )
}
