import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  completeMonthlyReview,
  useCategories,
  useGoals,
  useMonthBudgets,
  useMonthlyReview,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { BudgetProgress } from '@/components/BudgetProgress'
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart'
import { GoalJar } from '@/components/GoalJar'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { CategoryIcon } from '@/utils/categoryIcons'
import { Amount, AmountPrivacyButton } from '@/components/Amount'
import { formatMonthTitle, shiftMonth } from '@/utils/date'
import {
  categoryBreakdown,
  percentDelta,
  spentByCategory,
  totalsFor,
  transactionsInMonth,
} from '@/utils/calculations'
import type { Budget, Category } from '@/types'

const MONTH_PATTERN = /^\d{4}-\d{2}$/

type StepId = 'welcome' | 'numbers' | 'budget' | 'categories' | 'goals' | 'note' | 'done'

interface CategoryCap {
  category: Category
  spent: number
  limit: number
}

export function ReviewShell() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-white text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="h-1.5 bg-blue-600" aria-hidden />
      <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
        <MonthlyReviewPage />
      </main>
    </div>
  )
}

export function MonthlyReviewPage() {
  const { month = '' } = useParams()
  if (!MONTH_PATTERN.test(month)) {
    return <Navigate to="/settings/review" replace />
  }
  return <ReviewFlow month={month} />
}

function ReviewFlow({ month }: { month: string }) {
  const navigate = useNavigate()
  const transactions = useTransactions()
  const categories = useCategories()
  const budgets = useMonthBudgets(month)
  const goals = useGoals()
  const settings = useSettings()
  const existing = useMonthlyReview(month)
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [note, setNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const snapshot = useMemo(() => {
    if (!transactions || !categories || !budgets || !goals) return null
    const monthly = transactionsInMonth(transactions, month)
    const previous = shiftMonth(month, -1)
    const totals = totalsFor(monthly)
    const previousTotals = totalsFor(transactionsInMonth(transactions, previous))
    const overall = budgets.find((budget) => budget.categoryId === null)
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const categoryCaps = capsFor(budgets, categoryById, transactions, month)

    return {
      totals,
      spendDelta: percentDelta(totals.expense, previousTotals.expense),
      incomeDelta: percentDelta(totals.income, previousTotals.income),
      overall,
      categoryCaps,
      breakdown: categoryBreakdown(monthly, categories, 'expense'),
      activityCount: monthly.length,
      previousLabel: formatMonthTitle(previous),
    }
  }, [transactions, categories, budgets, goals, month])

  const steps = useMemo(() => {
    const list: StepId[] = ['welcome', 'numbers']
    if (snapshot?.overall || (snapshot?.categoryCaps.length ?? 0) > 0) list.push('budget')
    if ((snapshot?.breakdown.slices.length ?? 0) > 0) list.push('categories')
    if ((goals?.length ?? 0) > 0) list.push('goals')
    list.push('note', 'done')
    return list
  }, [snapshot, goals])

  if (!transactions || !categories || !budgets || !goals || !settings || !snapshot) {
    return (
      <Loader
        className="min-h-dvh"
        title="Opening the review..."
        subtitle="Reading this month on this device"
      />
    )
  }

  const currency = settings.currency
  const title = formatMonthTitle(month)
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? 'welcome'
  const isDone = step === 'done'
  const isNote = step === 'note'
  const noteValue = note ?? existing?.note ?? ''
  const countedSteps = steps.length - 1

  function go(delta: number) {
    setDirection(delta)
    setStepIndex((current) => Math.min(steps.length - 1, Math.max(0, current + delta)))
  }

  async function finish() {
    setSaving(true)
    try {
      await completeMonthlyReview({ month, note: noteValue })
      go(1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          aria-label="Close review"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-400">
            {isDone ? 'Wrapped' : `${Math.min(stepIndex + 1, countedSteps)} of ${countedSteps}`}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center">
          <AmountPrivacyButton />
        </div>
      </header>

      <div
        className="mx-5 h-1 overflow-hidden rounded-full bg-blue-50"
        role="progressbar"
        aria-label="Review progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={Math.min(stepIndex, steps.length - 1) + 1}
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width]"
          style={{
            width: `${((Math.min(stepIndex, steps.length - 1) + 1) / steps.length) * 100}%`,
          }}
        />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto px-5 py-6"
          >
            {step === 'welcome' ? (
              <WelcomeStep
                title={title}
                activityCount={snapshot.activityCount}
                alreadyDone={Boolean(existing)}
              />
            ) : null}
            {step === 'numbers' ? (
              <NumbersStep
                totals={snapshot.totals}
                spendDelta={snapshot.spendDelta}
                incomeDelta={snapshot.incomeDelta}
                previousLabel={snapshot.previousLabel}
                currency={currency}
              />
            ) : null}
            {step === 'budget' ? (
              <BudgetStep
                overall={snapshot.overall}
                spent={snapshot.totals.expense}
                categoryCaps={snapshot.categoryCaps}
                currency={currency}
              />
            ) : null}
            {step === 'categories' ? (
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Where it went
                </h2>
                <p className="text-sm text-slate-500">
                  The larger slices are where most of this month's spending sat.
                </p>
                <CategoryDonutChart
                  slices={snapshot.breakdown.slices}
                  total={snapshot.breakdown.total}
                  currency={currency}
                />
              </div>
            ) : null}
            {step === 'goals' ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Goal jars
                </h2>
                <p className="text-sm text-slate-500">
                  A snapshot of what you've set aside so far.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <GoalJar key={goal.id} goal={goal} currency={currency} compact />
                  ))}
                </div>
              </div>
            ) : null}
            {step === 'note' ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  A note for later
                </h2>
                <p className="text-sm text-slate-500">
                  Optional. Stays on this device with the review.
                </p>
                <textarea
                  value={noteValue}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={280}
                  rows={5}
                  placeholder="Anything you want to remember about this month"
                  className="w-full resize-none rounded-2xl border border-blue-100 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <p className="text-right text-xs text-slate-400">{noteValue.length}/280</p>
              </div>
            ) : null}
            {step === 'done' ? (
              <div className="flex min-h-full flex-col justify-center space-y-4 py-10 text-center">
                <p className="text-sm font-medium text-blue-600">That's the month</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {title} is wrapped
                </h2>
                <p className="text-sm leading-relaxed text-slate-500">
                  You can open this review again from Settings whenever you like.
                </p>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="grid grid-cols-2 gap-2 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {isDone ? (
          <Button className="col-span-2 py-3" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        ) : (
          <>
            <Button
              className="bg-slate-100 text-slate-700"
              onClick={() => (stepIndex === 0 ? navigate(-1) : go(-1))}
            >
              {stepIndex === 0 ? 'Close' : 'Back'}
            </Button>
            <Button
              className="py-3"
              disabled={saving}
              onClick={() => {
                if (isNote) void finish()
                else go(1)
              }}
            >
              {saving ? 'Saving…' : isNote ? 'Finish' : 'Continue'}
            </Button>
          </>
        )}
      </footer>
    </div>
  )
}

function capsFor(
  budgets: Budget[],
  categoryById: Map<string, Category>,
  transactions: Parameters<typeof spentByCategory>[0],
  month: string,
): CategoryCap[] {
  return budgets.flatMap((budget) => {
    if (!budget.categoryId) return []
    const category = categoryById.get(budget.categoryId)
    if (!category) return []
    return [
      {
        category,
        spent: spentByCategory(transactions, month, budget.categoryId),
        limit: budget.amount,
      },
    ]
  })
}

function WelcomeStep({
  title,
  activityCount,
  alreadyDone,
}: {
  title: string
  activityCount: number
  alreadyDone: boolean
}) {
  return (
    <div className="space-y-4 pt-6">
      <p className="text-sm font-medium text-blue-600">Monthly review</p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
        A quiet look at {title}
      </h2>
      <p className="text-sm leading-relaxed text-slate-500">
        A few short screens. No scores — just income, spending
        {activityCount === 1 ? ', and one entry' : `, and ${activityCount} entries`} from this
        month.
      </p>
      {alreadyDone ? (
        <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-600">
          You already finished this review. Walk through it again, or update the note at the end.
        </p>
      ) : null}
    </div>
  )
}

function NumbersStep({
  totals,
  spendDelta,
  incomeDelta,
  previousLabel,
  currency,
}: {
  totals: { income: number; expense: number; net: number }
  spendDelta: number | null
  incomeDelta: number | null
  previousLabel: string
  currency: string
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">The totals</h2>
      <div className="space-y-3 rounded-3xl bg-blue-600 p-5 text-white">
        <p className="text-sm text-blue-100">Net</p>
        <p className="text-3xl font-semibold tracking-tight">
          <Amount value={totals.net} currency={currency} />
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-blue-100">Income</p>
            <p className="mt-0.5 font-medium">
              <Amount value={totals.income} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-blue-100">Spent</p>
            <p className="mt-0.5 font-medium">
              <Amount value={totals.expense} currency={currency} />
            </p>
          </div>
        </div>
      </div>
      {spendDelta !== null && Math.abs(spendDelta) >= 5 ? (
        <p className="text-sm leading-relaxed text-slate-600">
          Spending was {Math.abs(spendDelta)}% {spendDelta > 0 ? 'higher' : 'lower'} than{' '}
          {previousLabel}.
        </p>
      ) : incomeDelta !== null && Math.abs(incomeDelta) >= 5 ? (
        <p className="text-sm leading-relaxed text-slate-600">
          Income was {Math.abs(incomeDelta)}% {incomeDelta > 0 ? 'higher' : 'lower'} than{' '}
          {previousLabel}.
        </p>
      ) : spendDelta !== null ? (
        <p className="text-sm leading-relaxed text-slate-500">
          Spending was close to {previousLabel}.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-500">
          Not enough of a previous month yet for a comparison — that's fine.
        </p>
      )}
    </div>
  )
}

function BudgetStep({
  overall,
  spent,
  categoryCaps,
  currency,
}: {
  overall?: { amount: number }
  spent: number
  categoryCaps: CategoryCap[]
  currency: string
}) {
  const over = categoryCaps.filter((row) => row.spent > row.limit)

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Budgets</h2>
      {overall ? (
        <BudgetProgress label="Overall" spent={spent} limit={overall.amount} currency={currency} />
      ) : (
        <p className="text-sm text-slate-500">No overall budget was set for this month.</p>
      )}
      {over.length > 0 ? (
        <ul className="space-y-3">
          {over.map((row) => (
            <li key={row.category.id} className="flex items-center gap-3 text-sm">
              <span
                className="flex size-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${row.category.color}1a`,
                  color: row.category.color,
                }}
              >
                <CategoryIcon name={row.category.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-700">{row.category.name}</span>
              <span className="text-slate-500">
                <Amount value={row.spent - row.limit} currency={currency} /> past its cap
              </span>
            </li>
          ))}
        </ul>
      ) : categoryCaps.length > 0 ? (
        <p className="text-sm text-slate-500">Category caps held this month.</p>
      ) : null}
    </div>
  )
}
