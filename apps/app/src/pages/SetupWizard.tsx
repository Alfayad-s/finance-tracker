import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { addAccount, putSettings, useSettings } from '@/db/hooks'
import { Button } from '@/components/ui/Button'
import { accountKindLabel } from '@/utils/accounts'
import type { AccountType } from '@/types'

interface Draft {
  name: string
  type: AccountType
  balance: string
  limit: string
}

const emptyBank: Draft = { name: 'Main bank', type: 'bank', balance: '', limit: '' }

export function SetupWizard({ onDone }: { onDone: () => void }) {
  const settings = useSettings()
  const [name, setName] = useState(settings?.displayName ?? '')
  const [main, setMain] = useState<Draft>(emptyBank)
  const [extras, setExtras] = useState<Draft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currency = settings?.currency ?? 'INR'

  const rows = useMemo(() => [main, ...extras], [main, extras])

  function parseBalance(value: string) {
    const amount = Number(value.replace(/,/g, '').trim())
    if (value.trim() === '') return 0
    if (!Number.isFinite(amount) || amount < 0) return null
    return amount
  }

  async function finish() {
    const parsed = rows.map((row) => ({
      ...row,
      name: row.name.trim() || accountKindLabel(row.type),
      opening: parseBalance(row.balance),
      limit: row.type === 'credit' ? parseBalance(row.limit) : null,
    }))
    if (parsed.some((row) => row.opening === null)) {
      setError('Enter 0 or a current balance for each account.')
      return
    }
    if (parsed.some((row) => row.type === 'credit' && row.limit === null)) {
      setError('Enter a credit limit for each card, or 0 if you do not know it yet.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await putSettings({
        displayName: name.trim().slice(0, 20),
        accountsSetupComplete: true,
      })
      for (const row of parsed) {
        await addAccount({
          name: row.name,
          type: row.type,
          openingBalance: row.opening ?? 0,
          creditLimit: row.type === 'credit' ? (row.limit ?? 0) : undefined,
        })
      }
      onDone()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save accounts')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-white px-5 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <p className="text-[11px] font-medium tracking-[0.16em] text-slate-400 uppercase">Welcome</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Start with what you have</h1>
      <p className="mt-2 text-sm leading-5 text-slate-500">
        Add today’s balances. From here, every income and expense is logged against an account or card.
      </p>

      <label className="mt-8 block">
        <span className="text-sm font-medium text-slate-800">Your name</span>
        <input
          value={name}
          maxLength={20}
          onChange={(event) => setName(event.target.value)}
          placeholder="Optional"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none"
        />
      </label>

      <AccountFields
        title="Main bank account"
        hint={`Current balance in ${currency}`}
        draft={main}
        onChange={setMain}
      />

      {extras.map((row, index) => (
        <div key={index} className="relative">
          <AccountFields
            title={accountKindLabel(row.type)}
            hint={row.type === 'credit' ? 'Amount you currently owe' : `Current balance in ${currency}`}
            draft={row}
            onChange={(next) => {
              setExtras((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)))
            }}
          />
          <button
            type="button"
            aria-label="Remove account"
            className="absolute top-8 right-0 rounded-full p-2 text-slate-400 hover:text-red-600"
            onClick={() => setExtras((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700"
          onClick={() => setExtras((current) => [...current, { name: '', type: 'bank', balance: '', limit: '' }])}
        >
          <Plus className="size-4" />
          Bank / cash
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700"
          onClick={() => setExtras((current) => [...current, { name: '', type: 'credit', balance: '', limit: '' }])}
        >
          <Plus className="size-4" />
          Credit card
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-auto space-y-2 pt-8">
        <Button className="w-full" disabled={saving} onClick={() => void finish()}>
          {saving ? 'Saving…' : 'Start tracking'}
        </Button>
        <button
          type="button"
          className="w-full py-2 text-sm text-slate-400"
          disabled={saving}
          onClick={() => {
            void putSettings({ accountsSetupComplete: true }).then(onDone)
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

function AccountFields({
  title,
  hint,
  draft,
  onChange,
}: {
  title: string
  hint: string
  draft: Draft
  onChange: (draft: Draft) => void
}) {
  return (
    <fieldset className="mt-6 space-y-3">
      <legend className="text-sm font-medium text-slate-800">{title}</legend>
      {draft.type !== 'bank' || title !== 'Main bank account' ? (
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1">
          {(['bank', 'cash', 'credit'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...draft, type })}
              className={`rounded-lg py-1.5 text-xs font-medium ${
                draft.type === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {accountKindLabel(type)}
            </button>
          ))}
        </div>
      ) : null}
      <input
        value={draft.name}
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
        placeholder={draft.type === 'credit' ? 'HDFC card' : 'HDFC savings'}
        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none"
      />
      <label className="block">
        <span className="text-xs text-slate-400">{hint}</span>
        <input
          inputMode="decimal"
          value={draft.balance}
          onChange={(event) => onChange({ ...draft, balance: event.target.value })}
          placeholder="0"
          className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none"
        />
      </label>
      {draft.type === 'credit' ? (
        <label className="block">
          <span className="text-xs text-slate-400">Credit limit</span>
          <input
            inputMode="decimal"
            value={draft.limit}
            onChange={(event) => onChange({ ...draft, limit: event.target.value })}
            placeholder="150000"
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none"
          />
        </label>
      ) : null}
    </fieldset>
  )
}
