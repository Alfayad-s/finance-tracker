import { useMemo, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCategories, useMonthBudgets, useMonthlyReviews, useSettings, useTransactions } from '@/db/hooks'
import { BudgetProgress } from '@/components/BudgetProgress'
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart'
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart'
import { SoftInsight } from '@/components/SoftInsight'
import { InstallBanner } from '@/components/InstallApp'
import { BalanceCard } from '@/components/BalanceCard'
import { AvatarFace, isAvatarId } from '@/components/avatars'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { TransactionDetail } from '@/components/TransactionDetail'
import { TransactionItem } from '@/components/TransactionItem'
import { formatCurrency } from '@/utils/currency'
import { currentMonth, formatMonthTitle, lastNMonths, previousMonth } from '@/utils/date'
import { pickSoftInsight } from '@/utils/insights'
import {
  categoryBreakdown,
  greeting,
  monthlyTotals,
  totalsFor,
  transactionsInMonth,
} from '@/utils/calculations'

export function Home() {
  const categories = useCategories()
  const settings = useSettings()
  const transactions = useTransactions()
  const month = currentMonth()
  const lastMonth = previousMonth()
  const budgets = useMonthBudgets(month)
  const reviews = useMonthlyReviews()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const overview = useMemo(() => {
    if (!transactions || !categories) return null
    const monthly = transactionsInMonth(transactions, month)
    const monthTotals = totalsFor(monthly)
    const breakdown = categoryBreakdown(monthly, categories, 'expense')
    const trend = monthlyTotals(transactions, lastNMonths(6, month))
    const overallBudget = (budgets ?? []).find((budget) => budget.categoryId === null)

    return {
      monthTotals,
      breakdown,
      trend,
      hasTrend: trend.some((row) => row.income > 0 || row.expense > 0),
      recent: transactions.slice(0, 5),
      overallBudget,
    }
  }, [transactions, categories, month, budgets])

  if (!categories || !settings || !transactions || !overview || !budgets) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Opening your data..."
        subtitle="Reading the local database on this device"
      />
    )
  }

  const currency = settings.currency
  const monthLabel = formatMonthTitle(month)
  const displayName = settings.displayName.trim()
  const avatarId = isAvatarId(settings.avatarId) ? settings.avatarId : 1
  const selected = selectedId
    ? transactions.find((transaction) => transaction.id === selectedId)
    : undefined
  const pendingReview =
    reviews &&
    transactions.some((transaction) => transaction.date.startsWith(lastMonth)) &&
    !reviews.some((review) => review.month === lastMonth)
  const insight = settings.softInsightsEnabled
    ? pickSoftInsight({
        transactions,
        categories,
        budgets,
        month,
        previousMonth: lastMonth,
        currency,
      })
    : null

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to="/settings"
            aria-label="Edit profile"
            className="relative mt-0.5 size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-100"
          >
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="scale-[1.1]">
                <AvatarFace id={avatarId} />
              </span>
            </span>
          </Link>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">
              {greeting()}
              {displayName ? `, ${displayName}` : ''}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {monthLabel}
            </h1>
          </div>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <Settings className="size-5" strokeWidth={1.75} aria-hidden />
        </Link>
      </header>

      <InstallBanner />

      <BalanceCard
        balance={overview.monthTotals.net}
        currency={currency}
        month={month}
        holder={displayName || 'This device'}
      />

      {pendingReview ? (
        <Link
          to={`/review/${lastMonth}`}
          className="block rounded-2xl border border-blue-100 bg-blue-50 p-4"
        >
          <p className="text-sm font-semibold text-slate-900">
            Review {formatMonthTitle(lastMonth)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            A short look at last month's income, spending, and goals.
          </p>
          <p className="mt-3 text-sm font-medium text-blue-600">Begin</p>
        </Link>
      ) : null}

      {insight ? <SoftInsight insight={insight} /> : null}

      {transactions.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Start with one entry"
          description="Tap + to add income or an expense. Everything stays on this device."
        />
      ) : (
        <>
      <section className="rounded-2xl border border-blue-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">This month</h2>
          <Link
            to="/budgets"
            className="text-sm font-medium text-blue-600"
          >
            Budgets
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500">Income</p>
            <p className="mt-1 text-sm font-semibold text-blue-700">
              {formatCurrency(overview.monthTotals.income, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Spent</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(overview.monthTotals.expense, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Net</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                overview.monthTotals.net >= 0 ? 'text-blue-700' : 'text-slate-900'
              }`}
            >
              {formatCurrency(overview.monthTotals.net, currency)}
            </p>
          </div>
        </div>

        {overview.overallBudget ? (
          <div className="mt-5 border-t border-blue-50 pt-4">
            <BudgetProgress
              label="Overall budget"
              spent={overview.monthTotals.expense}
              limit={overview.overallBudget.amount}
              currency={currency}
            />
          </div>
        ) : null}

        {overview.breakdown.slices.length > 0 ? (
          <CategoryDonutChart
            slices={overview.breakdown.slices}
            total={overview.breakdown.total}
            currency={currency}
          />
        ) : (
          <div className="mt-4">
            <EmptyState
              compact
              icon={Plus}
              title="No spending yet"
              description="Add an expense when you have one. Income still shows above."
            />
          </div>
        )}
      </section>

      {overview.hasTrend ? (
        <section className="rounded-2xl border border-blue-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Last 6 months</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-blue-300" aria-hidden />
                Income
              </span>
              <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-blue-600" aria-hidden />
                Spent
              </span>
            </div>
          </div>
          <div className="mt-3">
            <SpendingTrendChart months={overview.trend} currency={currency} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-blue-100 bg-white px-4">
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent</h2>
          <Link to="/transactions" className="text-sm font-medium text-blue-600">
            See all
          </Link>
        </div>
        <ul className="divide-y divide-blue-50">
          {overview.recent.map((transaction) => (
            <li key={transaction.id}>
              <TransactionItem
                transaction={transaction}
                category={categories.find(
                  (category) => category.id === transaction.categoryId,
                )}
                currency={currency}
                onOpen={() => setSelectedId(transaction.id)}
              />
            </li>
          ))}
        </ul>
      </section>
        </>
      )}

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
