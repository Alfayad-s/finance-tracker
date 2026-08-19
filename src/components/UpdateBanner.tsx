import { useEffect, useId, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { usePwaUpdate } from '@/hooks/usePwaUpdate'

const INSTALL_STEPS = [
  'Preparing the latest version',
  'Installing new features',
  'Almost ready',
] as const

const INSTALL_MS = 1800

export function UpdateBanner() {
  const { available, update } = usePwaUpdate()
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [step, setStep] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  const visible = available && !dismissed

  useFocusTrap(visible, updating ? () => undefined : () => setDismissed(true), sheetRef)

  useEffect(() => {
    if (!updating) return

    const stepTimer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, INSTALL_STEPS.length - 1))
    }, INSTALL_MS / INSTALL_STEPS.length)

    const reloadTimer = window.setTimeout(() => {
      update()
    }, INSTALL_MS)

    return () => {
      window.clearInterval(stepTimer)
      window.clearTimeout(reloadTimer)
    }
  }, [updating, update])

  return (
    <AnimatePresence>
      {visible ? (
        <div className="fixed inset-0 z-[70] mx-auto max-w-lg">
          <motion.button
            type="button"
            aria-label="Dismiss update"
            className="absolute inset-0 bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            disabled={updating}
            onClick={() => {
              if (!updating) setDismissed(true)
            }}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            aria-busy={updating}
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl outline-none"
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
            </div>

            <AnimatePresence mode="wait">
              {updating ? (
                <motion.div
                  key="installing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="px-5 pb-8 pt-4"
                >
                  <Loader
                    size="sm"
                    className="min-h-0 gap-5 bg-transparent p-2"
                    title="Updating Finance Tracker"
                    subtitle={INSTALL_STEPS[step]}
                  />
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-blue-600"
                      initial={{ width: '8%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: INSTALL_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="px-5 pb-5 pt-4"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Sparkles className="size-5" aria-hidden />
                  </span>
                  <h2 id={titleId} className="mt-4 text-lg font-semibold text-slate-900">
                    New version available
                  </h2>
                  <p id={descId} className="mt-1 text-sm leading-relaxed text-slate-500">
                    A newer Finance Tracker is ready on this device. Update now to get the latest
                    features. Your money data stays here.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button
                      className="bg-slate-100 text-slate-700"
                      onClick={() => setDismissed(true)}
                    >
                      Later
                    </Button>
                    <Button
                      onClick={() => {
                        setStep(0)
                        setUpdating(true)
                      }}
                    >
                      Update now
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
