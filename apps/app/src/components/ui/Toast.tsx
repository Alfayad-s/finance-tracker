import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(onDismiss, 2200)
    return () => window.clearTimeout(timeout)
  }, [message, onDismiss])

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto max-w-lg px-4"
        >
          <p
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {message}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
