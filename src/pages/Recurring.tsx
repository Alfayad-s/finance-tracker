import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, Pause, Pencil, Play, Plus, Repeat, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  addRecurringRule,
  deleteRecurringRule,
  setRecurringActive,
  updateRecurringRule,
  useCategories,
  useRecurringRules,
  useSettings,
} from '@/db/hooks'
import { generateDueRecurringTransactions } from '@/db/recurring'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { CategoryIcon } from '@/utils/categoryIcons'
import { formatCurrency } from '@/utils/currency'
import { formatDisplayDate, todayISO } from '@/utils/date'
import { frequencyLabel, RECURRING_FREQUENCIES } from '@/utils/recurring'
import type { Category, RecurringFrequency, RecurringRule, TransactionType } from '@/types'

interface RuleDraft {
  type: TransactionType
  amount: string
  categoryId: string
  note: string
  frequency: RecurringFrequency
  startDate: string
  endDate: string
}

function categoriesForType(categories: Category[], type: TransactionType) {
  return categories.filter((category) => category.type === type || category.type === 'both')
}

export function RecurringPage() {
  const rules = useRecurringRules()
  const categories = useCategories()
  const settings = useSettings()
  const [editing, setEditing] = useState<RecurringRule | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<RecurringRule | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const currency = settings?.currency ?? 'INR'
  const categoryById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  )

  async function saveRule(draft: RuleDraft, current: RecurringRule | null) {
    const amount = Number(draft.amount.replace(/,/g, '').trim())
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than 0')
      return
    }
    if (!draft.categoryId) {
      setError('Choose a category')
      return
    }
    if (draft.endDate && draft.endDate < (current?.startDate ?? draft.startDate)) {
      setError('End date must be on or after the start date')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (current) {
        await updateRecurringRule(current.id, {
          type: draft.type,
          amount,
          categoryId: draft.categoryId,
          note: draft.note.trim() || undefined,
          frequency: draft.frequency,
          endDate: draft.endDate || undefined,
        })
      } else {
        await addRecurringRule({
          type: draft.type,
          amount,
          categoryId: draft.categoryId,
          note: draft.note.trim() || undefined,
          frequency: draft.frequency,
          startDate: draft.startDate,
          endDate: draft.endDate || undefined,
          active: true,
        })
      }
      await generateDueRecurringTransactions()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  if (!rules || !categories || !settings) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading recurring..."
        subtitle="Reading schedules on this device"
      />
    )
  }

  const editorRule = editing === 'new' || editing === null ? null : editing

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            aria-label="Back to settings"
            className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          >
          <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Recurring
            </h1>
            <p className="text-sm text-slate-500">Rent, salary, and anything that repeats</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setEditing('new')
          }}
          className="rounded-full bg-blue-600 p-2 text-white"
          aria-label="Add recurring transaction"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </header>

      {rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nothing repeats yet"
          description="Add rent, salary, or subscriptions and they will appear in Transactions on each due date."
          actionLabel="Add recurring"
          onAction={() => {
            setError(null)
            setEditing('new')
          }}
        />
      ) : (
        <ul className="divide-y divide-blue-50 overflow-hidden rounded-2xl border border-blue-100 bg-white">
          {rules.map((rule) => {
            const category = categoryById.get(rule.categoryId)
            const paused = !rule.active
            return (
              <li key={rule.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${category?.color ?? '#2563eb'}1a`,
                    color: category?.color ?? '#2563eb',
                  }}
                >
                  <CategoryIcon name={category?.icon ?? 'CircleEllipsis'} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {category?.name ?? 'Uncategorized'}
                    <span className="ml-1.5 text-xs font-normal text-slate-400">
                      {frequencyLabel(rule.frequency)}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {paused
                      ? 'Paused'
                      : `Next ${formatDisplayDate(rule.nextDate)}`}
                    {rule.note ? ` · ${rule.note}` : ''}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    rule.type === 'income' ? 'text-blue-700' : 'text-slate-900'
                  }`}
                >
                  {rule.type === 'income' ? '+' : '−'}
                  {formatCurrency(rule.amount, currency)}
                </p>
                <button
                  type="button"
                  aria-label={paused ? `Resume ${category?.name ?? 'rule'}` : `Pause ${category?.name ?? 'rule'}`}
                  onClick={() => {
                    void (async () => {
                      await setRecurringActive(rule.id, paused)
                      if (paused) await generateDueRecurringTransactions()
                    })()
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${category?.name ?? 'rule'}`}
                  onClick={() => {
                    setError(null)
                    setEditing(rule)
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${category?.name ?? 'rule'}`}
                  onClick={() => {
                    setError(null)
                    setPendingDelete(rule)
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
        <Repeat className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Entries already added stay in Transactions if you pause or delete a rule.
        Opening the app creates any that are due.
      </p>

      <AnimatePresence>
        {editing ? (
          <RuleEditor
            title={editorRule ? 'Edit recurring' : 'New recurring'}
            categories={categories}
            initial={
              editorRule
                ? {
                    type: editorRule.type,
                    amount: String(editorRule.amount),
                    categoryId: editorRule.categoryId,
                    note: editorRule.note ?? '',
                    frequency: editorRule.frequency,
                    startDate: editorRule.startDate,
                    endDate: editorRule.endDate ?? '',
                  }
                : {
                    type: 'expense',
                    amount: '',
                    categoryId: categoriesForType(categories, 'expense')[0]?.id ?? '',
                    note: '',
                    frequency: 'monthly',
                    startDate: todayISO(),
                    endDate: '',
                  }
            }
            startLocked={Boolean(editorRule)}
            saving={saving}
            error={error}
            onClose={() => setEditing(null)}
            onSave={(draft) => saveRule(draft, editorRule)}
          />
        ) : null}
      </AnimatePresence>

      {pendingDelete ? (
        <ConfirmDialog
          title="Stop this repeating item?"
          description="Future dates will not be added. Transactions already created stay as they are."
          confirmLabel="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void (async () => {
              await deleteRecurringRule(pendingDelete.id)
              setPendingDelete(null)
            })()
          }}
        />
      ) : null}
    </section>
  )
}

function RuleEditor({
  title,
  categories,
  initial,
  startLocked,
  saving,
  error,
  onClose,
  onSave,
}: {
  title: string
  categories: Category[]
  initial: RuleDraft
  startLocked: boolean
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (values: RuleDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(initial)
  const dialogRef = useRef<HTMLElement | null>(null)
  const visibleCategories = categoriesForType(categories, draft.type)
  useFocusTrap(true, onClose, dialogRef)

  function setType(type: TransactionType) {
    const list = categoriesForType(categories, type)
    const categoryId = list.some((category) => category.id === draft.categoryId)
      ? draft.categoryId
      : (list[0]?.id ?? '')
    setDraft({ ...draft, type, categoryId })
  }

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
        aria-labelledby="recurring-editor-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 id="recurring-editor-title" className="text-lg font-semibold text-slate-900">
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
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
            {(['expense', 'income'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setType(type)}
                aria-pressed={draft.type === type}
                className={cn(
                  'rounded-xl py-2 text-sm font-medium capitalize',
                  draft.type === type ? 'bg-blue-600 text-white' : 'text-slate-500',
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input
              value={draft.amount}
              onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              value={draft.categoryId}
              onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600"
            >
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Repeats</span>
            <select
              value={draft.frequency}
              onChange={(event) =>
                setDraft({ ...draft, frequency: event.target.value as RecurringFrequency })
              }
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600"
            >
              {RECURRING_FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequencyLabel(frequency)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Starts</span>
            <input
              type="date"
              value={draft.startDate}
              disabled={startLocked}
              onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 disabled:text-slate-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Ends (optional)</span>
            <input
              type="date"
              value={draft.endDate}
              min={draft.startDate}
              onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Note</span>
            <input
              value={draft.note}
              onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              maxLength={80}
              placeholder="Optional"
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={saving || !draft.categoryId} className="w-full py-3">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </motion.section>
    </div>
  )
}
