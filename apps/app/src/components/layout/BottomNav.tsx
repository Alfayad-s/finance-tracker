import { useLayoutEffect, useRef } from 'react'
import {
  Home,
  List,
  PieChart,
  Plus,
  Target,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import gsap from 'gsap'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/transactions', label: 'Activity', icon: List, end: false },
  { to: '/budgets', label: 'Budgets', icon: PieChart, end: false },
  { to: '/goals', label: 'Goals', icon: Target, end: false },
] as const

const PILL_EASE = 'expo.out'
const PILL_DURATION = 0.72

function tabIsActive(tab: (typeof tabs)[number], pathname: string) {
  if (tab.end) return pathname === tab.to
  return pathname === tab.to || pathname.startsWith(`${tab.to}/`)
}

export function BottomNav({ onAdd }: { onAdd: () => void }) {
  const { pathname } = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const firstMove = useRef(true)

  useLayoutEffect(() => {
    const bar = barRef.current
    const pill = pillRef.current
    if (!bar || !pill) return

    const tween = { duration: PILL_DURATION, ease: PILL_EASE }
    const xTo = gsap.quickTo(pill, 'x', tween)
    const yTo = gsap.quickTo(pill, 'y', tween)
    const wTo = gsap.quickTo(pill, 'width', { ...tween, duration: 0.8 })
    const hTo = gsap.quickTo(pill, 'height', tween)

    const moveToActive = () => {
      const activeIndex = tabs.findIndex((tab) => tabIsActive(tab, pathname))
      const item = itemRefs.current[activeIndex]
      if (!item) return

      const barBox = bar.getBoundingClientRect()
      const itemBox = item.getBoundingClientRect()
      const x = itemBox.left - barBox.left
      const y = itemBox.top - barBox.top
      const width = itemBox.width
      const height = itemBox.height

      if (firstMove.current) {
        gsap.set(pill, { x, y, width, height, opacity: 1 })
        firstMove.current = false
        return
      }

      xTo(x)
      yTo(y)
      wTo(width)
      hTo(height)
    }

    moveToActive()
    const frame = window.requestAnimationFrame(moveToActive)
    const observer = new ResizeObserver(moveToActive)
    observer.observe(bar)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      gsap.killTweensOf(pill)
    }
  }, [pathname])

  return (
    <nav
      className="fixed inset-x-0 bottom-4 z-10 mx-auto w-full max-w-lg px-3 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div
        ref={barRef}
        className="relative flex w-full items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
      >
        <div
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-slate-100"
        />
        {tabs.slice(0, 2).map((tab, index) => (
          <TabLink
            key={tab.to}
            tab={tab}
            active={tabIsActive(tab, pathname)}
            itemRef={(node) => {
              itemRefs.current[index] = node
            }}
          />
        ))}

        <motion.button
          type="button"
          aria-label="Add transaction"
          onClick={onAdd}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="relative z-10 mx-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"
        >
          <Plus className="size-5" strokeWidth={2.25} aria-hidden />
        </motion.button>

        {tabs.slice(2).map((tab, index) => (
          <TabLink
            key={tab.to}
            tab={tab}
            active={tabIsActive(tab, pathname)}
            itemRef={(node) => {
              itemRefs.current[index + 2] = node
            }}
          />
        ))}
      </div>
    </nav>
  )
}

function TabLink({
  tab,
  active,
  itemRef,
}: {
  tab: (typeof tabs)[number]
  active: boolean
  itemRef: (node: HTMLDivElement | null) => void
}) {
  const Icon = tab.icon

  return (
    <div ref={itemRef} className="relative z-10 flex min-w-0 flex-1">
      <NavLink
        to={tab.to}
        end={tab.end}
        className="flex w-full flex-col items-center justify-center gap-0.5 rounded-full px-3.5 py-2 text-[10px] font-medium"
      >
        <motion.span
          animate={{
            color: active ? '#0f172a' : '#94a3b8',
            scale: active ? 1.06 : 1,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        >
          <Icon className="size-5" strokeWidth={active ? 2.1 : 1.75} aria-hidden />
        </motion.span>
        <motion.span
          animate={{ color: active ? '#0f172a' : '#94a3b8' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab.label}
        </motion.span>
      </NavLink>
    </div>
  )
}
