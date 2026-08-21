import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImagePlus, Pencil, Wallet, X } from 'lucide-react'
import {
  deleteTransaction,
  updateAccount,
  useAccounts,
  useCategories,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { FlippablePaymentCard } from '@/components/AccountCardSlider'
import { TransactionItem } from '@/components/TransactionItem'
import { TransactionDetail } from '@/components/TransactionDetail'
import { EmptyState } from '@/components/ui/EmptyState'
import { Amount } from '@/components/Amount'
import {
  accountKindLabel,
  availableCredit,
  CARD_THEMES,
  currentBalance,
  defaultThemeFor,
  openingForCurrentBalance,
} from '@/utils/accounts'
import { BANK_ISSUERS, CARD_NETWORKS, digitsOnly, groupedPan, issuerOf } from '@/utils/bankBrands'
import { fileToReceiptDataUrl } from '@/utils/receipt'
import type { BankIssuerId, CardNetwork, CardThemeId } from '@/types'
import { cn } from '@/lib/utils'

export function AccountDetailPage() {
  const { id } = useParams()
  const accounts = useAccounts()
  const account = accounts?.find((row) => row.id === id)
  const transactions = useTransactions()
  const categories = useCategories()
  const settings = useSettings()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [holderName, setHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cvv, setCvv] = useState('')
  const [expires, setExpires] = useState('')
  const [issuerId, setIssuerId] = useState<BankIssuerId>('generic')
  const [brandFace, setBrandFace] = useState<'logo' | 'name'>('logo')
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>()
  const [network, setNetwork] = useState<CardNetwork>('none')
  const [balance, setBalance] = useState('')
  const [limit, setLimit] = useState('')
  const [theme, setTheme] = useState<CardThemeId>('mist')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const related = useMemo(() => {
    if (!account || !transactions) return []
    return [...transactions]
      .filter((row) => row.accountId === account.id || row.transferToAccountId === account.id)
      .toSorted((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt))
  }, [account, transactions])

  useEffect(() => {
    if (!account || !transactions || editing) return
    setName(account.name)
    setHolderName(account.holderName ?? '')
    setCardNumber(account.cardNumber ?? '')
    setCvv(account.cvv ?? '')
    setExpires(account.expires ?? '')
    setIssuerId(account.issuerId ?? 'generic')
    setBrandFace(account.brandFace ?? 'logo')
    setLogoDataUrl(account.logoDataUrl)
    setNetwork(account.network ?? 'none')
    setBalance(String(currentBalance(account, transactions)))
    setLimit(account.creditLimit != null ? String(account.creditLimit) : '')
    setTheme(account.theme ?? defaultThemeFor(account.type))
  }, [account, transactions, editing])

  if (!accounts || !transactions || !categories || !settings) {
    return <Loader size="sm" className="min-h-[40dvh] p-4" title="Opening account..." />
  }

  if (!account) {
    return (
      <section className="space-y-4">
        <header className="flex items-center gap-2">
          <BackButton to="/" label="Back to home" />
          <h1 className="text-2xl font-semibold">Account not found</h1>
        </header>
        <Link to="/settings/accounts" className="text-sm font-medium text-blue-600">
          All accounts
        </Link>
      </section>
    )
  }

  const currentAccount = account
  const rows = transactions
  const currency = settings.currency
  const livePreview = Number(balance.replace(/,/g, '').trim())
  const display = editing
    ? {
        ...account,
        name: name.trim() || account.name,
        holderName: holderName.trim(),
        cardNumber: digitsOnly(cardNumber),
        cvv: digitsOnly(cvv),
        last4: digitsOnly(cardNumber).slice(-4) || account.last4,
        expires: expires.trim(),
        issuerId,
        brandFace,
        logoDataUrl,
        network,
        theme,
        creditLimit: account.type === 'credit' ? Number(limit) || account.creditLimit : account.creditLimit,
        openingBalance: Number.isFinite(livePreview)
          ? openingForCurrentBalance(account, transactions, livePreview)
          : account.openingBalance,
      }
    : account
  const leftover = availableCredit(display, transactions)
  const selected = related.find((row) => row.id === selectedId)

  async function save() {
    const live = Number(balance.replace(/,/g, '').trim())
    if (!Number.isFinite(live) || live < 0) {
      setError(currentAccount.type === 'credit' ? 'Enter the amount you owe' : 'Enter the current balance')
      return
    }
    let creditLimit: number | undefined
    if (currentAccount.type === 'credit') {
      const cap = Number(limit.replace(/,/g, '').trim())
      if (!Number.isFinite(cap) || cap < 0) {
        setError('Enter a credit limit')
        return
      }
      creditLimit = cap
    }
    setSaving(true)
    setError(null)
    try {
      await updateAccount(currentAccount.id, {
        name: name.trim() || currentAccount.name,
        holderName: holderName.trim() || undefined,
        cardNumber: digitsOnly(cardNumber) || '',
        cvv: digitsOnly(cvv) || '',
        last4: digitsOnly(cardNumber).slice(-4) || currentAccount.last4,
        expires: expires.trim() || undefined,
        issuerId,
        brandFace,
        logoDataUrl: logoDataUrl ?? '',
        network,
        openingBalance: openingForCurrentBalance(currentAccount, rows, live),
        creditLimit,
        theme,
      })
      setEditing(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-2">
        <BackButton to="/" label="Back to home" />
        <div className="min-w-0 flex-1" />
        {editing ? (
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            aria-label="Cancel editing"
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Edit card"
            onClick={() => setEditing(true)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <Pencil className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </header>

      <FlippablePaymentCard account={display} transactions={transactions} currency={currency} />

      {!editing ? (
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={account.type === 'credit' ? 'Amount due' : 'Balance'}
            value={<Amount value={currentBalance(account, transactions)} currency={currency} />}
          />
          {account.type === 'credit' ? (
            <Stat
              label="Limit"
              value={
                account.creditLimit != null ? (
                  <Amount value={account.creditLimit} currency={currency} />
                ) : (
                  '—'
                )
              }
            />
          ) : (
            <Stat label="Bank" value={issuerOf(account.issuerId).label} />
          )}
          {account.type === 'credit' && leftover != null ? (
            <Stat label="Available" value={<Amount value={leftover} currency={currency} />} />
          ) : null}
          <Stat label="Type" value={accountKindLabel(account.type)} />
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Card name">
            <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </Field>
          <Field label={account.type === 'credit' ? 'Amount due' : 'Current balance'}>
            <input inputMode="decimal" value={balance} onChange={(event) => setBalance(event.target.value)} className={fieldClass} />
          </Field>
          {account.type === 'credit' ? (
            <Field label="Credit limit">
              <input inputMode="decimal" value={limit} onChange={(event) => setLimit(event.target.value)} className={fieldClass} />
            </Field>
          ) : null}
          <Field label="Name on card">
            <input
              value={holderName}
              onChange={(event) => setHolderName(event.target.value)}
              placeholder={settings.displayName || 'Your name'}
              className={fieldClass}
            />
          </Field>
          <Field label="Full card number">
            <input
              inputMode="numeric"
              autoComplete="off"
              value={groupedPan(cardNumber)}
              onChange={(event) => setCardNumber(digitsOnly(event.target.value).slice(0, 19))}
              placeholder="ACCT-000006"
              className={`${fieldClass} font-mono tracking-wide`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry">
              <input
                value={expires}
                onChange={(event) => setExpires(event.target.value.slice(0, 5))}
                placeholder="08/28"
                className={fieldClass}
              />
            </Field>
            <Field label="CVV">
              <input
                inputMode="numeric"
                autoComplete="off"
                value={cvv}
                onChange={(event) => setCvv(digitsOnly(event.target.value).slice(0, 4))}
                placeholder="•••"
                className={fieldClass}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-800">On the card</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={brandFace === 'logo'}
                onClick={() => setBrandFace('logo')}
                className={cn(
                  'h-11 rounded-xl text-sm font-medium',
                  brandFace === 'logo' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700',
                )}
              >
                Bank logo
              </button>
              <button
                type="button"
                aria-pressed={brandFace === 'name'}
                onClick={() => setBrandFace('name')}
                className={cn(
                  'h-11 rounded-xl text-sm font-medium',
                  brandFace === 'name' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700',
                )}
              >
                Bank name
              </button>
            </div>
          </fieldset>
          <Field label="Bank / issuer">
            <select value={issuerId} onChange={(event) => setIssuerId(event.target.value as BankIssuerId)} className={fieldClass}>
              {BANK_ISSUERS.map((issuer) => (
                <option key={issuer.id} value={issuer.id}>
                  {issuer.label}
                </option>
              ))}
            </select>
          </Field>
          <LogoPicker value={logoDataUrl} onChange={setLogoDataUrl} />
          {account.type !== 'cash' ? (
            <Field label="Network">
              <select value={network} onChange={(event) => setNetwork(event.target.value as CardNetwork)} className={fieldClass}>
                {CARD_NETWORKS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <fieldset>
            <legend className="text-sm font-medium text-slate-800">Card theme</legend>
            <div className="mt-2 grid grid-cols-8 gap-2">
              {CARD_THEMES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={theme === option.id}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    'h-9 rounded-xl',
                    option.className,
                    theme === option.id ? 'ring-2 ring-slate-900 ring-offset-2' : 'ring-1 ring-black/10',
                  )}
                />
              ))}
            </div>
          </fieldset>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="w-full" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save card'}
          </Button>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">History</h2>
        {related.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={Wallet}
              compact
              title="No logs on this card yet"
              description="Quick Add on home and pick this account."
            />
          </div>
        ) : (
          <ul className="mt-1 divide-y divide-blue-50">
            {related.map((transaction) => (
              <li key={transaction.id}>
                <TransactionItem
                  transaction={transaction}
                  category={categories.find((category) => category.id === transaction.categoryId)}
                  currency={currency}
                  onOpen={() => setSelectedId(transaction.id)}
                  onDelete={() => {
                    void deleteTransaction(transaction.id)
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <TransactionDetail
          transaction={selected}
          category={categories.find((category) => category.id === selected.categoryId)}
          currency={currency}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  )
}

const fieldClass = 'mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      {children}
    </label>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
      <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function LogoPicker({
  value,
  onChange,
}: {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  return (
    <div>
      <p className="text-sm font-medium text-slate-800">Your bank logo</p>
      <p className="mt-0.5 text-xs text-slate-400">Optional. Replaces the built-in mark. Stays on this device.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setReading(true)
          void fileToReceiptDataUrl(file)
            .then((url) => onChange(url))
            .finally(() => {
              setReading(false)
              if (inputRef.current) inputRef.current.value = ''
            })
        }}
      />
      {value ? (
        <div className="mt-2 flex items-center gap-3">
          <img src={value} alt="" className="h-10 w-10 rounded-lg bg-slate-100 object-contain p-1" />
          <button type="button" className="text-sm font-medium text-red-600" onClick={() => onChange(undefined)}>
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={reading}
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-700"
        >
          <ImagePlus className="size-4" aria-hidden />
          {reading ? 'Adding…' : 'Upload logo'}
        </button>
      )}
    </div>
  )
}
