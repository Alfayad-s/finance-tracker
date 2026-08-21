import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PiggyBank, Plus, Trash2, X } from 'lucide-react'
import {
  addGoal,
  deleteGoal,
  fundGoal,
  updateGoal,
  useGoals,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoalJar } from '@/components/GoalJar'
import { Amount, AmountPrivacyButton } from '@/components/Amount'
import { Loader } from '@/components/ui/Loader'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { SymbolPicker } from '@/components/SymbolPicker'
import { formatDisplayDate, todayISO } from '@/utils/date'
import { totalsFor } from '@/utils/calculations'
import type { Goal } from '@/types'

const COLORS = ['#2563eb', '#3b82f6', '#1d4ed8', '#38bdf8', '#6366f1', '#0ea5e9'] as const

const COLOR_LABELS: Record<(typeof COLORS)[number], string> = {
  '#2563eb': 'Blue',
  '#3b82f6': 'Sky blue',
  '#1d4ed8': 'Deep blue',
  '#38bdf8': 'Cyan',
  '#6366f1': 'Indigo',
  '#0ea5e9': 'Azure',
}

interface GoalDraft {
  name: string
  targetAmount: string
  icon: string
  color: string
  deadline: string
}

const emptyDraft: GoalDraft = {
  name: '',
  targetAmount: '',
  icon: 'PiggyBank',
  color: '#2563eb',
  deadline: '',
}

export function Goals() {
  const goals = useGoals()
  const settings = useSettings()
  const transactions = useTransactions()
  const [selected, setSelected] = useState<Goal | null>(null)
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currency = settings?.currency ?? 'INR'
  const allocated = useMemo(
    () => (goals ?? []).reduce((total, goal) => total + goal.currentAmount, 0),
    [goals],
  )
  const balance = transactions ? totalsFor(transactions).net : 0
  const available = balance - allocated

  const selectedLive = (goals ?? []).find((goal) => goal.id === selected?.id) ?? selected

  async function handleFund(delta: number) {
    if (!selectedLive) return
    if (delta > 0 && delta > available + 0.001) {
      setError('Not enough unallocated balance')
      return
    }
    if (delta < 0 && Math.abs(delta) > selectedLive.currentAmount + 0.001) {
      setError('Not enough in this jar')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await fundGoal(selectedLive.id, delta)
      setSelected(updated)
      setFundAmount('')
    } finally {
      setBusy(false)
    }
  }

  if (!goals || !settings || !transactions) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading goals..."
        subtitle="Reading savings jars on this device"
      />
    )
  }

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <BackButton to="/" label="Back to home" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Goals</h1>
            <p className="mt-1 text-sm text-slate-500">
              <Amount value={Math.max(0, available)} currency={currency} /> free to put in a jar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AmountPrivacyButton />
          <button
            type="button"
            aria-label="Add goal"
            onClick={() => {
              setError(null)
              setEditing('new')
            }}
            className="rounded-full bg-blue-600 p-2 text-white"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No jars yet"
          description="Create one for a trip, an emergency fund, or anything you are saving toward."
          actionLabel="Create a goal"
          onAction={() => setEditing('new')}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.28 }}
            >
              <GoalJar
                goal={goal}
                currency={currency}
                compact
                onClick={() => {
                  setError(null)
                  setFundAmount('')
                  setSelected(goal)
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedLive && !pendingDelete ? (
          <GoalDetail
            goal={selectedLive}
            currency={currency}
            available={available}
            fundAmount={fundAmount}
            busy={busy}
            error={error}
            onFundAmountChange={setFundAmount}
            onClose={() => {
              setSelected(null)
              setError(null)
              setFundAmount('')
            }}
            onAdd={() => {
              const amount = Number(fundAmount.replace(/,/g, '').trim())
              if (!Number.isFinite(amount) || amount <= 0) {
                setError('Enter an amount greater than 0')
                return
              }
              void handleFund(amount)
            }}
            onWithdraw={() => {
              const amount = Number(fundAmount.replace(/,/g, '').trim())
              if (!Number.isFinite(amount) || amount <= 0) {
                setError('Enter an amount greater than 0')
                return
              }
              void handleFund(-amount)
            }}
            onEdit={() => {
              setEditing(selectedLive)
              setSelected(null)
            }}
            onDelete={() => setPendingDelete(selectedLive)}
          />
        ) : null}
      </AnimatePresence>

      {pendingDelete ? (
        <ConfirmDialog
          title={`Delete ${pendingDelete.name}?`}
          description="Money in this jar goes back to unallocated balance. You can’t undo this."
          confirmLabel="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void (async () => {
              await deleteGoal(pendingDelete.id)
              setPendingDelete(null)
              setSelected(null)
            })()
          }}
        />
      ) : null}

      <AnimatePresence>
        {editing ? (
          <GoalEditor
            title={editing === 'new' ? 'New goal' : 'Edit goal'}
            initial={
              editing === 'new'
                ? emptyDraft
                : {
                    name: editing.name,
                    targetAmount: String(editing.targetAmount),
                    icon: editing.icon,
                    color: editing.color,
                    deadline: editing.deadline ?? '',
                  }
            }
            saving={busy}
            error={error}
            onClose={() => {
              setEditing(null)
              setError(null)
            }}
            onSave={async (draft) => {
              const name = draft.name.trim()
              const targetAmount = Number(draft.targetAmount.replace(/,/g, '').trim())
              if (!name) {
                setError('Enter a goal name')
                return
              }
              if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                setError('Enter a target greater than 0')
                return
              }
              setBusy(true)
              setError(null)
              try {
                if (editing === 'new') {
                  await addGoal({
                    name,
                    targetAmount,
                    currentAmount: 0,
                    icon: draft.icon,
                    color: draft.color,
                    deadline: draft.deadline || undefined,
                  })
                } else {
                  await updateGoal(editing.id, {
                    name,
                    targetAmount,
                    icon: draft.icon,
                    color: draft.color,
                    deadline: draft.deadline || undefined,
                  })
                }
                setEditing(null)
              } finally {
                setBusy(false)
              }
            }}
          />
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function GoalDetail({
  goal,
  currency,
  available,
  fundAmount,
  busy,
  error,
  onFundAmountChange,
  onClose,
  onAdd,
  onWithdraw,
  onEdit,
  onDelete,
}: {
  goal: Goal
  currency: string
  available: number
  fundAmount: string
  busy: boolean
  error: string | null
  onFundAmountChange: (value: string) => void
  onClose: () => void
  onAdd: () => void
  onWithdraw: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const dialogRef = useRef<HTMLElement | null>(null)
  useFocusTrap(true, onClose, dialogRef)
  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-lg">
      <motion.button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-detail-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <header className="mb-2 flex items-center justify-between">
          <h2 id="goal-detail-title" className="text-lg font-semibold text-slate-900">
            {goal.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <GoalJar goal={goal} currency={currency} />

        {goal.deadline ? (
          <p className="mt-3 text-center text-sm text-slate-500">
            Deadline {formatDisplayDate(goal.deadline)}
          </p>
        ) : null}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Amount value={Math.max(0, available)} currency={currency} /> available to add
        </p>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-700">Amount</span>
          <input
            inputMode="decimal"
            value={fundAmount}
            onChange={(event) => onFundAmountChange(event.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-lg font-semibold text-slate-900 outline-none"
          />
        </label>

        {error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button disabled={busy} onClick={onAdd} className="py-3">
            Add
          </Button>
          <Button
            disabled={busy}
            onClick={onWithdraw}
            className="bg-slate-100 py-3 text-slate-700"
          >
            Withdraw
          </Button>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <button type="button" onClick={onEdit} className="text-sm font-medium text-blue-600">
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-600"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </button>
        </div>
      </motion.section>
    </div>
  )
}

function GoalEditor({
  title,
  initial,
  saving,
  error,
  onClose,
  onSave,
}: {
  title: string
  initial: GoalDraft
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (draft: GoalDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(initial)
  const dialogRef = useRef<HTMLElement | null>(null)
  useFocusTrap(true, onClose, dialogRef)

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-lg">
      <motion.button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-editor-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 id="goal-editor-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            void onSave(draft)
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              maxLength={32}
              placeholder="Emergency fund"
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Target</span>
            <input
              inputMode="decimal"
              value={draft.targetAmount}
              onChange={(event) => setDraft({ ...draft, targetAmount: event.target.value })}
              placeholder="0"
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-lg font-semibold text-slate-900 outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Deadline</span>
            <input
              type="date"
              min={todayISO()}
              value={draft.deadline}
              onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Icon or emoji</legend>
            <SymbolPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Color</legend>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={COLOR_LABELS[color]}
                  aria-pressed={draft.color === color}
                  onClick={() => setDraft({ ...draft, color })}
                  className={cn(
                    'size-8 rounded-full border-2',
                    draft.color === color ? 'border-slate-900' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </fieldset>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={saving} className="w-full py-3">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </motion.section>
    </div>
  )
}
