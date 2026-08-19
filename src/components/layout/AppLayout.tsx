import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { generateDueRecurringTransactions } from '@/db/recurring'
import { TransactionForm } from '@/components/TransactionForm'
import { Toast } from '@/components/ui/Toast'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const location = useLocation()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), [])
  const openQuickAdd = useCallback(() => setQuickAddOpen(true), [])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void generateDueRecurringTransactions()
      }
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-white text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="h-1.5 bg-blue-600" aria-hidden />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-5 pt-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] outline-none"
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <BottomNav onAdd={openQuickAdd} />
      <TransactionForm
        open={quickAddOpen}
        onClose={closeQuickAdd}
        onSaved={(message) => {
          setQuickAddOpen(false)
          setToast(message)
        }}
      />
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
