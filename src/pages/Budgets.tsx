import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Plus, Shapes, Trash2, X } from 'lucide-react'
import {
  deleteBudget,
  upsertBudget,
  useCategories,
  useMonthBudgets,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { BudgetProgress } from '@/components/BudgetProgress'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { CategoryIcon } from '@/utils/categoryIcons'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { formatCurrency } from '@/utils/currency'
import { currentMonth, formatMonthTitle, shiftMonth } from '@/utils/date'
import { spentByCategory } from '@/utils/calculations'
import type { Category } from '@/types'
import { db } from '@/db/db'

export function Budgets() {
  const [month, setMonth] = useState(currentMonth)
  const budgets = useMonthBudgets(month)
  const categories = useCategories()
  const transactions = useTransactions()
  const settings = useSettings()
  const [editor, setEditor] = useState<
    { categoryId: string | null; amount: string; id?: string } | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)

  const expenseCategories = useMemo(
    () =>
      (categories ?? []).filter(
        (category) => category.type === 'expense' || category.type === 'both',
      ),
    [categories],
  )

  const overall = budgets?.find((budget) => budget.categoryId === null)
  const categoryBudgets = useMemo(() => {
    if (!budgets) return []
    return budgets.filter((budget) => budget.categoryId !== null)
  }, [budgets])

  const spentOverall = transactions ? spentByCategory(transactions, month) : 0
  const currency = settings?.currency ?? 'INR'
  const thisMonth = currentMonth()
  const canGoForward = month < shiftMonth(thisMonth, 1)

  const unusedCategories = expenseCategories.filter(
    (category) => !categoryBudgets.some((budget) => budget.categoryId === category.id),
  )

  async function copyPreviousMonth() {
    setCopying(true)
    try {
      const previous = shiftMonth(month, -1)
      const previousBudgets = await db.budgets.where('month').equals(previous).toArray()
      await Promise.all(
        previousBudgets.map((budget) =>
          upsertBudget({
            month,
            categoryId: budget.categoryId,
            amount: budget.amount,
          }),
        ),
      )
    } finally {
      setCopying(false)
    }
  }

  async function saveEditor() {
    if (!editor) return
    const amount = Number(editor.amount.replace(/,/g, '').trim())
    if (!Number.isFinite(amount) || amount <= 0) return
    setSaving(true)
    try {
      await upsertBudget({
        month,
        categoryId: editor.categoryId,
        amount,
      })
      setEditor(null)
    } finally {
      setSaving(false)
    }
  }

  if (!budgets || !categories || !transactions || !settings) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading budgets..."
        subtitle="Reading this month on this device"
      />
    )
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth(shiftMonth(month, -1))}
          className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {formatMonthTitle(month)}
          </h1>
          <p className="text-sm text-slate-500">Monthly budgets</p>
        </div>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoForward}
          onClick={() => setMonth(shiftMonth(month, 1))}
          className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-white p-4">
        {overall ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Overall</h2>
              <button
                type="button"
                className="text-sm font-medium text-blue-600"
                onClick={() =>
                  setEditor({
                    categoryId: null,
                    amount: String(overall.amount),
                    id: overall.id,
                  })
                }
              >
                Edit
              </button>
            </div>
            <BudgetProgress
              label="All spending"
              spent={spentOverall}
              limit={overall.amount}
              currency={currency}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Overall budget</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cap everything you spend this month.
              </p>
            </div>
            <Button
              className="shrink-0 px-3 py-2 text-sm"
              onClick={() => setEditor({ categoryId: null, amount: '' })}
            >
              Set
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
          {unusedCategories.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setEditor({
                  categoryId: unusedCategories[0]?.id ?? null,
                  amount: '',
                })
              }
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600"
            >
              <Plus className="size-4" aria-hidden />
              Add
            </button>
          ) : null}
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="space-y-2">
            <EmptyState
              icon={Shapes}
              title="No category budgets"
              description="Cap groceries, rent, or anything you want to keep an eye on."
              actionLabel={unusedCategories.length > 0 ? 'Add one' : undefined}
              onAction={
                unusedCategories.length > 0
                  ? () =>
                      setEditor({
                        categoryId: unusedCategories[0]?.id ?? null,
                        amount: '',
                      })
                  : undefined
              }
            />
            <button
              type="button"
              disabled={copying}
              className="w-full text-center text-sm font-medium text-blue-600 disabled:opacity-50"
              onClick={() => void copyPreviousMonth()}
            >
              {copying ? 'Copying…' : 'Copy last month'}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {categoryBudgets.map((budget) => {
              const category = expenseCategories.find(
                (item) => item.id === budget.categoryId,
              )
              const spent = spentByCategory(
                transactions,
                month,
                budget.categoryId ?? undefined,
              )

              return (
                <li
                  key={budget.id}
                  className="rounded-2xl border border-blue-100 bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex size-8 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${category?.color ?? '#2563eb'}1a`,
                          color: category?.color ?? '#2563eb',
                        }}
                      >
                        <CategoryIcon
                          name={category?.icon ?? 'CircleEllipsis'}
                          className="size-4"
                        />
                      </span>
                      <span className="truncate font-medium text-slate-900">
                        {category?.name ?? 'Category'}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-sm font-medium text-blue-600"
                      onClick={() =>
                        setEditor({
                          categoryId: budget.categoryId,
                          amount: String(budget.amount),
                          id: budget.id,
                        })
                      }
                    >
                      Edit
                    </button>
                  </div>
                  <BudgetProgress
                    label="Spent"
                    spent={spent}
                    limit={budget.amount}
                    currency={currency}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {editor ? (
          <BudgetEditor
            overall={editor.categoryId === null}
            categories={unusedCategories}
            selectedId={editor.categoryId}
            amount={editor.amount}
            existing={Boolean(editor.id)}
            saving={saving}
            currency={currency}
            onAmountChange={(amount) => setEditor({ ...editor, amount })}
            onCategoryChange={(categoryId) => setEditor({ ...editor, categoryId })}
            onClose={() => setEditor(null)}
            onSave={() => void saveEditor()}
            onDelete={
              editor.id
                ? async () => {
                    await deleteBudget(editor.id!)
                    setEditor(null)
                  }
                : undefined
            }
          />
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function BudgetEditor({
  overall,
  categories,
  selectedId,
  amount,
  existing,
  saving,
  currency,
  onAmountChange,
  onCategoryChange,
  onClose,
  onSave,
  onDelete,
}: {
  overall: boolean
  categories: Category[]
  selectedId: string | null
  amount: string
  existing: boolean
  saving: boolean
  currency: string
  onAmountChange: (amount: string) => void
  onCategoryChange: (categoryId: string) => void
  onClose: () => void
  onSave: () => void
  onDelete?: () => Promise<void>
}) {
  const parsed = Number(amount.replace(/,/g, '').trim())
  const canSave = Number.isFinite(parsed) && parsed > 0 && (overall || selectedId)
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
        aria-labelledby="budget-editor-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 id="budget-editor-title" className="text-lg font-semibold text-slate-900">
            {overall ? 'Overall budget' : existing ? 'Edit category budget' : 'Category budget'}
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
            if (canSave) onSave()
          }}
        >
          {!overall && !existing ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={selectedId ?? ''}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder={formatCurrency(0, currency).replace(/[\d.,]/g, '').trim() || '0'}
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-lg font-semibold text-slate-900 outline-none focus:border-blue-600"
            />
          </label>

          <Button type="submit" disabled={saving || !canSave} className="w-full py-3">
            {saving ? 'Saving…' : 'Save'}
          </Button>

          {onDelete ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-red-600"
            >
              <Trash2 className="size-4" aria-hidden />
              Remove budget
            </button>
          ) : null}
        </form>
      </motion.section>
    </div>
  )
}
