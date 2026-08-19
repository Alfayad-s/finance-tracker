import { formatCurrency } from '@/utils/currency'
import { Amount } from '@/components/Amount'
import { useAmountHidden } from '@/hooks/useAmountPrivacy'
import { usePrivacyStore } from '@/stores/privacyStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function BalanceCard({
  balance,
  currency,
  month,
  holder = 'This device',
}: {
  balance: number
  currency: string
  month: string
  holder?: string
}) {
  const [, year, monthNum] = month.match(/^(\d{4})-(\d{2})$/) ?? []
  const expiry = year && monthNum ? `${monthNum}/${year.slice(2)}` : month
  const hideAmounts = useSettingsStore((store) => store.settings?.hideAmounts === true)
  const hidden = useAmountHidden()
  const togglePeek = usePrivacyStore((store) => store.togglePeek)
  const amountLabel = hidden ? 'Amount hidden' : formatCurrency(balance, currency)

  const amount = (
    <Amount
      value={balance}
      currency={currency}
      className="min-w-0 truncate text-4xl leading-none font-bold tracking-tight text-neutral-800"
    />
  )

  return (
    <section
      className="relative flex aspect-[316/190] w-full flex-col justify-between overflow-hidden rounded-2xl bg-neutral-100 p-5 text-neutral-700 shadow-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:ring-black/10 before:ring-inset"
      aria-label="Balance card"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/80 to-transparent"
      />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/favicon.svg"
              alt=""
              className="size-6 rounded-md"
            />
            <p className="text-sm font-semibold tracking-wide text-neutral-700">
              Finance Tracker
            </p>
          </div>
          <p className="mt-3 text-[11px] tracking-[0.16em] text-neutral-400 uppercase">
            This month
          </p>
        </div>
        <ContactlessIcon className="mt-0.5 size-7 text-neutral-400" />
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-2">
            <ChipIcon />
            {hideAmounts ? (
              <button
                type="button"
                onClick={togglePeek}
                aria-label={hidden ? `Show amounts, currently hidden` : `Hide amounts, ${amountLabel}`}
                className="min-w-0 text-left"
              >
                {amount}
              </button>
            ) : (
              <p className="min-w-0 truncate">{amount}</p>
            )}
          </div>
          <div className="flex items-end gap-3 text-[11px] font-semibold tracking-[0.12em] text-neutral-700 uppercase">
            <p className="min-w-0 truncate">{holder}</p>
            <p className="ml-auto shrink-0 tabular-nums">{expiry}</p>
          </div>
        </div>
        <div className="flex h-8 w-11 shrink-0 items-center justify-center rounded bg-white">
          <CardMark />
        </div>
      </div>
    </section>
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
