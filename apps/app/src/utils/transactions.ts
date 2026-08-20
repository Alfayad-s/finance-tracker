import type { Category, Transaction, TransactionType } from '@/types'

export type TransactionTypeFilter = 'all' | TransactionType

export interface TransactionFilters {
  query: string
  type: TransactionTypeFilter
  categoryId: string
  month: string
}

export function filterTransactions(
  transactions: Transaction[],
  categories: Category[],
  filters: TransactionFilters,
): Transaction[] {
  const query = filters.query.trim().toLowerCase()
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return transactions
    .filter((transaction) => {
      if (filters.type !== 'all' && transaction.type !== filters.type) return false
      if (filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) {
        return false
      }
      if (filters.month !== 'all' && !transaction.date.startsWith(filters.month)) {
        return false
      }
      if (!query) return true

      const category = categoryById.get(transaction.categoryId)
      return (
        category?.name.toLowerCase().includes(query) ||
        transaction.note?.toLowerCase().includes(query) ||
        String(transaction.amount).includes(query)
      )
    })
    .toSorted((left, right) => {
      if (left.date !== right.date) return right.date.localeCompare(left.date)
      return right.createdAt.localeCompare(left.createdAt)
    })
}

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: { date: string; items: Transaction[] }[] = []

  for (const transaction of transactions) {
    const current = groups.at(-1)
    if (current && current.date === transaction.date) {
      current.items.push(transaction)
    } else {
      groups.push({ date: transaction.date, items: [transaction] })
    }
  }

  return groups
}
