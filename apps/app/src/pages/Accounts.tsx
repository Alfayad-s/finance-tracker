import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  addAccount,
  deleteAccount,
  useAccounts,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Amount } from '@/components/Amount'
import { Loader } from '@/components/ui/Loader'
import { accountKindLabel, currentBalance } from '@/utils/accounts'
import type { AccountType } from '@/types'

export function AccountsPage() {
  const accounts = useAccounts()
  const transactions = useTransactions()
  const settings = useSettings()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [balance, setBalance] = useState('')
  const [limit, setLimit] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const currency = settings?.currency ?? 'INR'

  if (!accounts || !transactions || !settings) {
    return <Loader size="sm" className="min-h-[40dvh] p-4" title="Loading accounts..." />
  }

  async function saveNew() {
    const amount = Number(balance.replace(/,/g, '').trim() || '0')
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid current balance')
      return
    }
    const cap = Number(limit.replace(/,/g, '').trim() || '0')
    if (type === 'credit' && (!Number.isFinite(cap) || cap < 0)) {
      setError('Enter a credit limit')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addAccount({
        name: name.trim() || accountKindLabel(type),
        type,
        openingBalance: amount,
        creditLimit: type === 'credit' ? cap : undefined,
      })
      setAdding(false)
      setName('')
      setBalance('')
      setLimit('')
      setType('bank')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BackButton to="/settings" label="Back to settings" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Accounts</h1>
            <p className="text-sm text-slate-500">Banks, cash, and cards on this device</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Add account"
          className="rounded-full bg-blue-600 p-2 text-white"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-5" />
        </button>
      </header>

      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Add a bank, cash, or credit card to start logging against real balances.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {accounts.map((account) => {
            const live = currentBalance(account, transactions)
            return (
              <li key={account.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/accounts/${account.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{account.name}</p>
                  <p className="text-xs text-slate-400">
                    {accountKindLabel(account.type)}
                    {account.type === 'credit' && account.creditLimit ? (
                      <>
                        {' · limit '}
                        <Amount value={account.creditLimit} currency={currency} />
                      </>
                    ) : null}
                  </p>
                </Link>
                <p className={`text-sm font-semibold ${account.type === 'credit' ? 'text-red-600' : 'text-slate-900'}`}>
                  <Amount value={live} currency={currency} />
                </p>
                <button
                  type="button"
                  aria-label={`Delete ${account.name}`}
                  className="rounded-full p-2 text-slate-400 hover:text-red-600"
                  onClick={() => {
                    void deleteAccount(account.id).catch((caught: unknown) => {
                      setError(caught instanceof Error ? caught.message : 'Could not delete')
                    })
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {adding ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-900">New account</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1">
            {(['bank', 'cash', 'credit'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-lg py-2 text-xs font-medium ${
                  type === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {accountKindLabel(value)}
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
          />
          <input
            inputMode="decimal"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            placeholder={type === 'credit' ? 'Amount owed now' : 'Current balance'}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
          />
          {type === 'credit' ? (
            <input
              inputMode="decimal"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="Credit limit"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
            />
          ) : null}
          <Button disabled={busy} onClick={() => void saveNew()}>
            {busy ? 'Saving…' : 'Save account'}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {accounts[0] ? (
        <p className="text-xs text-slate-400">
          Opening balances stay fixed. New logs move the live total. You can rename an account by
          saving a new one if needed.
        </p>
      ) : null}
    </section>
  )
}
