import {
  Home,
  List,
  PieChart,
  Plus,
  Target,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/transactions', label: 'Activity', icon: List, end: false },
  { to: '/budgets', label: 'Budgets', icon: PieChart, end: false },
  { to: '/goals', label: 'Goals', icon: Target, end: false },
] as const

export function BottomNav({ onAdd }: { onAdd: () => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-lg border-t border-blue-100 bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 items-center px-1 pt-2 pb-2">
        <TabLink tab={tabs[0]} />
        <TabLink tab={tabs[1]} />
        <div className="flex justify-center">
          <motion.button
            type="button"
            aria-label="Add transaction"
            onClick={onAdd}
            whileTap={{ scale: 0.9 }}
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"
          >
            <Plus className="size-6" strokeWidth={2.25} aria-hidden />
          </motion.button>
        </div>
        <TabLink tab={tabs[2]} />
        <TabLink tab={tabs[3]} />
      </div>
    </nav>
  )
}

function TabLink({
  tab,
}: {
  tab: (typeof tabs)[number]
}) {
  const Icon = tab.icon

  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-1 text-[11px] ${
          isActive ? 'text-blue-600' : 'text-slate-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <motion.span
            animate={{ scale: isActive ? 1.08 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.1 : 1.75} aria-hidden />
          </motion.span>
          {tab.label}
        </>
      )}
    </NavLink>
  )
}
