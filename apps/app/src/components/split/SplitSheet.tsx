import { useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export function SplitSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(open, onClose, ref)

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 mx-auto max-w-lg">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl outline-none"
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
            </div>
            <header className="flex items-center justify-between px-5 pt-3 pb-2">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
