import { getDate, getDaysInMonth, parseISO } from 'date-fns'
import type { Budget, Category, Transaction } from '@/types'
import { formatCurrency } from './currency'
import { spentByCategory, totalsFor, transactionsInMonth } from './calculations'

export interface SoftInsightData {
  id: string
  message: string
  detail?: string
}

function throughDay(transactions: Transaction[], month: string, day: number) {
  return transactions.filter((transaction) => {
    if (!transaction.date.startsWith(month)) return false
    return Number(transaction.date.slice(8, 10)) <= day
  })
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0 || current <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function pickSoftInsight({
  transactions,
  categories,
  budgets,
  month,
  previousMonth,
  currency,
  now = new Date(),
}: {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  month: string
  previousMonth: string
  currency: string
  now?: Date
}): SoftInsightData | null {
  const dayOfMonth = getDate(now)
  const daysInMonth = getDaysInMonth(now)
  const thisMonth = transactionsInMonth(transactions, month)
  const totals = totalsFor(thisMonth)
  const overall = budgets.find((budget) => budget.categoryId === null)
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  if (overall && totals.expense > overall.amount) {
    return {
      id: 'overall-over',
      message: "This month's spending is a little over the overall budget.",
      detail: `${formatCurrency(totals.expense - overall.amount, currency)} past the ${formatCurrency(overall.amount, currency)} cap.`,
    }
  }

  const overCategories = budgets
    .filter((budget) => budget.categoryId)
    .map((budget) => {
      const category = categoryById.get(budget.categoryId ?? '')
      if (!category) return null
      const spent = spentByCategory(transactions, month, budget.categoryId ?? undefined)
      return { category, spent, limit: budget.amount, over: spent - budget.amount }
    })
    .filter(
      (row): row is { category: Category; spent: number; limit: number; over: number } =>
        row !== null && row.over > 0,
    )
    .toSorted((left, right) => right.over - left.over)

  const topOver = overCategories[0]
  if (topOver) {
    return {
      id: `category-over-${topOver.category.id}`,
      message: `${topOver.category.name} is a little over its budget this month.`,
      detail: `${formatCurrency(topOver.over, currency)} past the ${formatCurrency(topOver.limit, currency)} cap.`,
    }
  }

  if (overall && totals.expense > 0 && dayOfMonth >= 8 && dayOfMonth <= daysInMonth - 3) {
    const projected = (totals.expense / dayOfMonth) * daysInMonth
    const used = totals.expense / overall.amount
    if (used >= 0.55 && projected > overall.amount) {
      return {
        id: 'pace',
        message: 'At this pace, spending may pass the overall budget before month end.',
        detail: `${formatCurrency(overall.amount - totals.expense, currency)} left with ${daysInMonth - dayOfMonth} days to go.`,
      }
    }
  }

  if (totals.income > 0 && totals.expense > totals.income) {
    return {
      id: 'ahead-of-income',
      message: 'Spending is a little ahead of income this month so far.',
      detail: `${formatCurrency(totals.expense - totals.income, currency)} more out than in.`,
    }
  }

  const lastMonthDays = getDaysInMonth(parseISO(`${previousMonth}-01`))
  const comparableDay = Math.min(dayOfMonth, lastMonthDays)
  const thisToDate = totalsFor(throughDay(thisMonth, month, comparableDay))
  const lastToDate = totalsFor(throughDay(transactions, previousMonth, comparableDay))
  const change = percentChange(thisToDate.expense, lastToDate.expense)

  if (change !== null && Math.abs(change) >= 15) {
    const direction = change > 0 ? 'higher' : 'lower'
    return {
      id: change > 0 ? 'vs-last-up' : 'vs-last-down',
      message: `Spending is ${Math.abs(change)}% ${direction} than last month at this point.`,
    }
  }

  if (totals.expense > 0) {
    const byCategory = new Map<string, number>()
    for (const transaction of thisMonth) {
      if (transaction.type !== 'expense') continue
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
      )
    }
    const leading = [...byCategory.entries()].toSorted((left, right) => right[1] - left[1])[0]
    if (leading) {
      const share = Math.round((leading[1] / totals.expense) * 100)
      const category = categoryById.get(leading[0])
      if (category && share >= 40) {
        return {
          id: `share-${category.id}`,
          message: `${category.name} is about ${share}% of this month's spending.`,
        }
      }
    }
  }

  if (overall && totals.expense > 0 && totals.expense <= overall.amount) {
    const remaining = overall.amount - totals.expense
    if (remaining / overall.amount >= 0.2) {
      return {
        id: 'budget-left',
        message: `There's ${formatCurrency(remaining, currency)} left in this month's overall budget.`,
      }
    }
  }

  return null
}
