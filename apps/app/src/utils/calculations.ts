import type { Category, Transaction, TransactionType } from '@/types'

export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0)
}

export function totalsFor(transactions: Transaction[]) {
  const income = sumAmounts(
    transactions
      .filter((transaction) => transaction.type === 'income' && !transaction.transferToAccountId)
      .map((transaction) => transaction.amount),
  )
  const expense = sumAmounts(
    transactions
      .filter((transaction) => transaction.type === 'expense' && !transaction.transferToAccountId)
      .map((transaction) => transaction.amount),
  )

  return {
    income,
    expense,
    net: income - expense,
  }
}

export function transactionsInMonth(transactions: Transaction[], month: string) {
  return transactions.filter((transaction) => transaction.date.startsWith(month))
}

export function topCategories(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType,
  limit = 4,
) {
  const totals = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.type !== type) continue
    if (transaction.transferToAccountId) continue
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amount,
    )
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      category: categoryById.get(categoryId),
      amount,
    }))
    .filter(
      (row): row is { category: Category; amount: number } => row.category !== undefined,
    )
    .toSorted((left, right) => right.amount - left.amount)
    .slice(0, limit)
}

export function monthlyTotals(transactions: Transaction[], months: string[]) {
  return months.map((month) => ({
    month,
    ...totalsFor(transactionsInMonth(transactions, month)),
  }))
}

export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType,
  limit = 5,
) {
  const ranked = topCategories(transactions, categories, type, Number.POSITIVE_INFINITY)
  const head = ranked.slice(0, limit)
  const rest = ranked.slice(limit)
  const otherAmount = sumAmounts(rest.map((row) => row.amount))
  const slices = head.map((row) => ({
    id: row.category.id,
    name: row.category.name,
    color: row.category.color,
    icon: row.category.icon,
    amount: row.amount,
  }))

  if (otherAmount > 0) {
    slices.push({
      id: 'other',
      name: 'Other',
      color: '#94a3b8',
      icon: 'CircleEllipsis',
      amount: otherAmount,
    })
  }

  return {
    slices,
    total: sumAmounts(ranked.map((row) => row.amount)),
  }
}

export function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function spentByCategory(
  transactions: Transaction[],
  month: string,
  categoryId?: string,
) {
  return sumAmounts(
    transactions
      .filter((transaction) => {
        if (transaction.type !== 'expense') return false
        if (!transaction.date.startsWith(month)) return false
        if (categoryId && transaction.categoryId !== categoryId) return false
        return true
      })
      .map((transaction) => transaction.amount),
  )
}
