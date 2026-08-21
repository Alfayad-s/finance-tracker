import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { Eye, EyeOff, RotateCw } from 'lucide-react'
import type { Account, Transaction } from '@/types'
import { availableCredit, currentBalance, themeOf } from '@/utils/accounts'
import { BankFace, displayCvv, displayPan, NetworkMark } from '@/utils/bankBrands'
import { formatCurrency } from '@/utils/currency'
import { Amount } from '@/components/Amount'
import { useAmountHidden } from '@/hooks/useAmountPrivacy'
import { usePrivacyStore } from '@/stores/privacyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'

export function AccountCardSlider({
  accounts,
  transactions,
  currency,
}: {
  accounts: Account[]
  transactions: Transaction[]
  currency: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [revealedId, setRevealedId] = useState<string | null>(null)

  function onScroll() {
    const node = scroller.current
    if (!node || accounts.length === 0) return
    const slide = node.querySelector('a')
    if (!slide) return
    const step = slide.getBoundingClientRect().width + 12
    const index = Math.round(node.scrollLeft / Math.max(step, 1))
    setActive(Math.min(accounts.length - 1, Math.max(0, index)))
  }

  return (
    <section className="space-y-3 bg-transparent">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Your cards</h2>
        <Link to="/settings/accounts" className="text-sm font-medium text-blue-600">
          Manage
        </Link>
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto bg-transparent px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {accounts.map((account) => (
          <Link
            key={account.id}
            to={`/accounts/${account.id}`}
            className="block w-[82%] shrink-0 snap-center bg-transparent"
          >
            <AccountSlideCard
              account={account}
              transactions={transactions}
              currency={currency}
              secretsVisible={revealedId === account.id}
              onToggleSecrets={() =>
                setRevealedId((current) => (current === account.id ? null : account.id))
              }
              flat
            />
          </Link>
        ))}
      </div>
      {accounts.length > 1 ? (
        <div className="flex justify-center gap-1.5">
          {accounts.map((account, index) => (
            <span
              key={account.id}
              className={`h-1.5 rounded-full ${active === index ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function FlippablePaymentCard({
  account,
  transactions,
  currency,
}: {
  account: Account
  transactions: Transaction[]
  currency: string
}) {
  const [flipped, setFlipped] = useState(false)
  const [secretsVisible, setSecretsVisible] = useState(false)

  return (
    <div className="space-y-3">
      <div className="[perspective:1200px]">
        <div
          className={cn(
            'relative aspect-[1.586] w-full transition-transform duration-500 [transform-style:preserve-3d]',
            flipped && '[transform:rotateY(180deg)]',
          )}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <AccountSlideCard
              account={account}
              transactions={transactions}
              currency={currency}
              secretsVisible={secretsVisible}
              onToggleSecrets={() => setSecretsVisible((value) => !value)}
              fill
            />
          </div>
          <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <CardBack
              account={account}
              secretsVisible={secretsVisible}
              onToggleSecrets={() => setSecretsVisible((value) => !value)}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="mx-auto flex h-11 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-800"
      >
        <RotateCw className="size-4" aria-hidden />
        {flipped ? 'Show front' : 'Rotate card'}
      </button>
    </div>
  )
}

export function AccountSlideCard({
  account,
  transactions,
  currency,
  secretsVisible = false,
  onToggleSecrets,
  fill = false,
  flat = false,
}: {
  account: Account
  transactions: Transaction[]
  currency: string
  secretsVisible?: boolean
  onToggleSecrets?: () => void
  fill?: boolean
  flat?: boolean
}) {
  const hideAmounts = useSettingsStore((store) => store.settings?.hideAmounts === true)
  const hidden = useAmountHidden()
  const togglePeek = usePrivacyStore((store) => store.togglePeek)
  const live = currentBalance(account, transactions)
  const isCredit = account.type === 'credit'
  const leftover = availableCredit(account, transactions)
  const theme = themeOf(account)
  const muted = theme.dark ? 'text-white/60' : 'text-neutral-500'
  const strong = theme.dark ? 'text-white' : 'text-neutral-900'
  const headline = hidden ? 'Amount hidden' : formatCurrency(live, currency)
  const holder = account.holderName?.trim()
  const kind = isCredit ? 'Credit' : account.type === 'cash' ? 'Cash' : 'Debit'

  const amount = (
    <Amount
      value={live}
      currency={currency}
      className={`min-w-0 truncate text-2xl leading-none font-bold tracking-tight ${strong}`}
    />
  )

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-[1.15rem] p-5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:ring-white/25 before:ring-inset',
        fill ? 'h-full w-full' : 'aspect-[1.586] w-full',
        flat ? 'shadow-none' : 'shadow-[0_12px_28px_-12px_rgba(15,23,42,0.45)]',
        theme.className,
      )}
      aria-label={account.name}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${theme.dark ? 'from-white/16 via-transparent to-black/25' : 'from-white via-white/20 to-black/10'}`}
      />
      <div className="relative flex h-full flex-col">
        <div className="flex h-8 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <BankFace account={account} light={theme.dark} />
          </div>
          <div className="flex h-8 shrink-0 items-center">
            {onToggleSecrets ? (
              <SecretsEye revealed={secretsVisible} onToggle={onToggleSecrets} className={muted} />
            ) : null}
            <ContactlessIcon className={`size-5 ${muted}`} />
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col justify-between">
          <div>
            <ChipIcon dark={theme.dark} />
            <p className={`mt-2.5 font-mono text-[13px] ${strong}`}>{displayPan(account, secretsVisible)}</p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${muted}`}>
                {isCredit ? 'Amount due' : 'Available'}
              </p>
              <div className="mt-1">
                {hideAmounts ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      togglePeek()
                    }}
                    aria-label={hidden ? 'Show amounts, currently hidden' : `Hide amounts, ${headline}`}
                    className="block min-w-0 text-left"
                  >
                    {amount}
                  </button>
                ) : (
                  <p className="min-w-0 truncate">{amount}</p>
                )}
              </div>
              {holder && holder !== account.name ? (
                <p className={`mt-1.5 truncate text-[11px] ${muted}`}>{holder}</p>
              ) : null}
              <p className={`mt-0.5 text-[10px] tracking-[0.12em] uppercase ${muted}`}>
                {account.expires ? `Exp ${secretsVisible ? account.expires : '••/••'}` : kind}
                {isCredit && leftover != null ? (
                  <>
                    {' · Avl '}
                    <Amount value={leftover} currency={currency} />
                  </>
                ) : null}
              </p>
            </div>
            <NetworkMark
              network={account.network}
              className={theme.dark && account.network === 'visa' ? '!text-white' : undefined}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function CardBack({
  account,
  secretsVisible,
  onToggleSecrets,
}: {
  account: Account
  secretsVisible: boolean
  onToggleSecrets: () => void
}) {
  const theme = themeOf(account)
  const strong = theme.dark ? 'text-white' : 'text-neutral-900'
  const muted = theme.dark ? 'text-white/60' : 'text-neutral-500'

  return (
    <article
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-[1.15rem] shadow-[0_12px_28px_-12px_rgba(15,23,42,0.45)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:ring-white/20 before:ring-inset',
        theme.className,
      )}
      aria-label={`${account.name} back`}
    >
      <div className="mt-5 h-10 bg-black/80" aria-hidden />
      <div className="relative flex flex-1 flex-col px-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="h-8 flex-1 rounded-sm bg-white px-2 py-1.5">
            <p className="font-mono text-[11px] tracking-widest text-slate-700">
              {secretsVisible ? account.holderName?.trim() || account.name : '••••••••'}
            </p>
          </div>
          <div className="flex h-8 min-w-12 items-center justify-center rounded-sm bg-white px-2">
            <p className="font-mono text-sm font-bold tracking-widest text-slate-900">
              {displayCvv(account.cvv, secretsVisible)}
            </p>
          </div>
          <SecretsEye revealed={secretsVisible} onToggle={onToggleSecrets} className={muted} />
        </div>
        <p className={`mt-4 font-mono text-[0.95rem] leading-snug tracking-[0.14em] ${strong}`}>
          {displayPan(account, secretsVisible)}
        </p>
        <div className={`mt-auto flex items-end justify-between ${muted}`}>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase">
            Exp {secretsVisible ? account.expires || '••/••' : '••/••'}
          </p>
          <p className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${strong}`}>CVV</p>
        </div>
      </div>
    </article>
  )
}

function SecretsEye({
  revealed,
  onToggle,
  className,
}: {
  revealed: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={revealed ? 'Hide card details' : 'Show card details'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      className={cn('flex size-8 items-center justify-center', className)}
    >
      {revealed ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
    </button>
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

function ChipIcon({ dark }: { dark: boolean }) {
  return (
    <svg viewBox="0 0 40 28" className="block h-7 w-9 shrink-0" aria-hidden>
      <rect width="40" height="28" rx="5" fill={dark ? '#d4af37' : '#e8c547'} />
      <rect x="1.2" y="1.2" width="37.6" height="25.6" rx="4" fill={dark ? '#c9a227' : '#f3d56b'} />
      <path d="M1 10h38M1 18h38M14 1v26" stroke={dark ? '#8a7019' : '#c4a028'} strokeWidth="1.2" />
    </svg>
  )
}
