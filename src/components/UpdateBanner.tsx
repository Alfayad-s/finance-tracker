import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { usePwaUpdate } from '@/hooks/usePwaUpdate'

export function UpdateBanner() {
  const { available, update } = usePwaUpdate()
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const visible = available && !dismissed

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="pointer-events-none fixed inset-x-0 top-4 z-[70] mx-auto max-w-lg px-4"
        >
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto rounded-2xl border border-blue-100 bg-white p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <RefreshCw className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">New version available</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Update now to get the latest features
                </p>
                <div className="mt-3">
                  <Button
                    className="px-3 py-2 text-sm"
                    disabled={updating}
                    onClick={() => {
                      setUpdating(true)
                      update()
                    }}
                  >
                    {updating ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss update prompt"
                onClick={() => setDismissed(true)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
