import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { formatCurrency } from '@/utils/currency'

const ORIGINAL_WIDTH = 316
const ORIGINAL_HEIGHT = 190

export function BalanceCard({
  balance,
  currency,
  month,
}: {
  balance: number
  currency: string
  month: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(ORIGINAL_WIDTH)
  const [, year, monthNum] = month.match(/^(\d{4})-(\d{2})$/) ?? []
  const expiry = year && monthNum ? `${monthNum}/${year.slice(2)}` : month

  useLayoutEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const update = () => setAvailable(node.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const { scale, scaledWidth, scaledHeight } = useMemo(() => {
    const width = Math.max(0, available)
    const nextScale = width / ORIGINAL_WIDTH
    return {
      scale: nextScale,
      scaledWidth: width,
      scaledHeight: ORIGINAL_HEIGHT * nextScale,
    }
  }, [available])

  return (
    <div ref={wrapRef} className="flex w-full justify-center px-2.5">
      <div className="relative" style={{ width: scaledWidth, height: scaledHeight }}>
        <section
          aria-label="Balance card"
          style={{
            transform: `scale(${scale})`,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
          }}
          className="absolute top-0 left-0 flex origin-top-left flex-col justify-between overflow-hidden rounded-2xl bg-neutral-100 p-4 text-neutral-700 shadow-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:ring-black/10 before:ring-inset"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/80 to-transparent"
          />

          <div className="relative flex items-start justify-between px-1 pt-1">
            <div>
              <p className="text-[15px] leading-none font-semibold tracking-wide text-neutral-700">
                Finance Tracker
              </p>
              <p className="mt-3 text-[11px] tracking-[0.16em] text-neutral-400 uppercase">
                Balance
              </p>
            </div>
            <ContactlessIcon className="size-7 text-neutral-400" />
          </div>

          <div className="relative flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-end gap-2">
                <ChipIcon />
                <p className="min-w-0 truncate text-[22px] leading-none font-semibold tracking-[0.6px] text-neutral-700 tabular-nums">
                  {formatCurrency(balance, currency)}
                </p>
              </div>
              <div className="flex items-end gap-2 text-xs font-semibold tracking-[0.6px] text-neutral-700 uppercase">
                <p className="min-w-0 truncate">This device</p>
                <p className="ml-auto shrink-0 tabular-nums">{expiry}</p>
              </div>
            </div>
            <div className="flex h-8 w-[46px] shrink-0 items-center justify-center rounded bg-white">
              <CardMark />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8.5 8.2c1.6 1.6 1.6 6 0 7.6M12 6c2.8 2.4 2.8 9.6 0 12M15.5 3.8c4 3.4 4 13 0 16.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 40 28" className="h-6 w-8 shrink-0" aria-hidden>
      <rect width="40" height="28" rx="5" fill="#d4d4d4" />
      <rect x="1.2" y="1.2" width="37.6" height="25.6" rx="4" fill="#e5e5e5" />
      <path d="M1 10h38M1 18h38M14 1v26" stroke="#a3a3a3" strokeWidth="1.2" />
    </svg>
  )
}

function CardMark() {
  return (
    <svg viewBox="0 0 36 22" className="h-4 w-7" aria-hidden>
      <circle cx="13" cy="11" r="9" fill="#eb001b" />
      <circle cx="23" cy="11" r="9" fill="#f79e1b" />
    </svg>
  )
}
