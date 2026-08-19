import { useLiveQuery } from 'dexie-react-hooks'
import type {
  Budget,
  Category,
  Goal,
  ImportRule,
  MonthlyReview,
  RecurringRule,
  Settings,
  Transaction,
  TransactionType,
} from '@/types'
import { todayISO } from '@/utils/date'
import { nextOccurrence } from '@/utils/recurring'
import { SETTINGS_ID } from './constants'
import { db } from './db'
import { DEFAULT_SETTINGS } from './seed'

export function useTransactions() {
  return useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [])
}

export function useRecentTransactions(limit = 5) {
  return useLiveQuery(
    () => db.transactions.orderBy('date').reverse().limit(limit).toArray(),
    [limit],
  )
}

export function useTransactionsSince(startDate: string) {
  return useLiveQuery(
    () => db.transactions.where('date').aboveOrEqual(startDate).sortBy('date'),
    [startDate],
  )
}

export function useTransactionCount() {
  return useLiveQuery(() => db.transactions.count(), [])
}

export function useMonthHasTransactions(month: string) {
  return useLiveQuery(
    () =>
      db.transactions
        .where('date')
        .between(`${month}-01`, `${month}-\uffff`, true, true)
        .count()
        .then((count) => count > 0),
    [month],
  )
}

export function useCategories() {
  return useLiveQuery(() => db.categories.orderBy('order').toArray(), [])
}

export function useMonthBudgets(month: string) {
  return useLiveQuery(
    () => db.budgets.where('month').equals(month).toArray(),
    [month],
  )
}

export async function upsertBudget(input: {
  month: string
  categoryId: string | null
  amount: number
}): Promise<Budget> {
  const existing = (await db.budgets.where('month').equals(input.month).toArray()).find(
    (budget) => budget.categoryId === input.categoryId,
  )

  if (existing) {
    await db.budgets.update(existing.id, { amount: input.amount })
    return { ...existing, amount: input.amount }
  }

  return addBudget(input)
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id)
}

export function useGoals() {
  return useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray(), [])
}

export function useSettings() {
  return useLiveQuery(async () => {
    return (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS
  }, [])
}

export function useRecurringRules() {
  return useLiveQuery(() => db.recurringRules.orderBy('createdAt').reverse().toArray(), [])
}

export async function getLatestTransaction(
  type?: TransactionType,
): Promise<Transaction | undefined> {
  if (type) {
    const rows = await db.transactions.where('type').equals(type).sortBy('createdAt')
    return rows.at(-1)
  }

  return db.transactions.orderBy('createdAt').last()
}

export async function addTransaction(
  input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<Transaction> {
  const now = new Date().toISOString()
  const transaction: Transaction = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  await db.transactions.add(transaction)
  return transaction
}

export async function addTransactions(
  inputs: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }>,
): Promise<number> {
  if (inputs.length === 0) return 0
  const now = new Date().toISOString()
  const rows: Transaction[] = inputs.map((input) => ({
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }))
  await db.transactions.bulkAdd(rows)
  return rows.length
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.transactions.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

export async function setReceiptPhoto(
  id: string,
  receiptPhoto: string | undefined,
): Promise<void> {
  const now = new Date().toISOString()
  if (receiptPhoto) {
    await db.transactions.update(id, { receiptPhoto, updatedAt: now })
    return
  }

  const current = await db.transactions.get(id)
  if (!current) return
  const next = { ...current, updatedAt: now }
  delete next.receiptPhoto
  await db.transactions.put(next)
}

export async function attachReceiptToDate(
  recurringId: string,
  date: string,
  receiptPhoto: string,
): Promise<void> {
  const match = await db.transactions
    .where('recurringId')
    .equals(recurringId)
    .filter((row) => row.date === date)
    .first()
  if (match) await setReceiptPhoto(match.id, receiptPhoto)
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

export async function addCategory(
  input: Omit<Category, 'id'> & { id?: string },
): Promise<Category> {
  const category: Category = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
  }
  await db.categories.add(category)
  return category
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, 'id'>>,
): Promise<void> {
  await db.categories.update(id, patch)
}

export async function countCategoryUsage(categoryId: string): Promise<number> {
  const [transactions, rules] = await Promise.all([
    db.transactions.where('categoryId').equals(categoryId).count(),
    db.recurringRules.where('categoryId').equals(categoryId).count(),
  ])
  return transactions + rules
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await db.categories.get(id)
  if (!category) return
  if (category.isDefault) {
    throw new Error('Built-in categories cannot be deleted')
  }
  const usage = await countCategoryUsage(id)
  if (usage > 0) {
    throw new Error('This category is used by existing transactions or recurring items')
  }
  await db.categories.delete(id)
}

export async function putSettings(
  patch: Partial<Omit<Settings, 'id'>>,
): Promise<Settings> {
  const current = (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS
  const next: Settings = { ...current, id: SETTINGS_ID, ...patch }
  await db.settings.put(next)
  return next
}

export async function addBudget(
  input: Omit<Budget, 'id'> & { id?: string },
): Promise<Budget> {
  const budget: Budget = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
  }
  await db.budgets.add(budget)
  return budget
}

export async function addGoal(
  input: Omit<Goal, 'id' | 'createdAt'> & { id?: string },
): Promise<Goal> {
  const goal: Goal = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  await db.goals.add(goal)
  return goal
}

export async function updateGoal(
  id: string,
  patch: Partial<Omit<Goal, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.goals.update(id, patch)
}

export async function deleteGoal(id: string): Promise<void> {
  await db.goals.delete(id)
}

export async function fundGoal(id: string, delta: number): Promise<Goal> {
  const goal = await db.goals.get(id)
  if (!goal) {
    throw new Error('Goal not found')
  }
  const currentAmount = Math.max(0, Math.round((goal.currentAmount + delta) * 100) / 100)
  await db.goals.update(id, { currentAmount })
  return { ...goal, currentAmount }
}

export async function addRecurringRule(
  input: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt' | 'nextDate'> & {
    id?: string
    nextDate?: string
  },
): Promise<RecurringRule> {
  const now = new Date().toISOString()
  const rule: RecurringRule = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    nextDate: input.nextDate ?? input.startDate,
    createdAt: now,
    updatedAt: now,
  }
  await db.recurringRules.add(rule)
  return rule
}

export async function updateRecurringRule(
  id: string,
  patch: Partial<Omit<RecurringRule, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.recurringRules.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const rule = await db.recurringRules.get(id)
  if (!rule) return

  const today = todayISO()
  let nextDate = rule.nextDate
  let hops = 0
  if (active && nextDate < today) {
    while (
      nextDate < today &&
      (!rule.endDate || nextDate <= rule.endDate) &&
      hops < 400
    ) {
      const advanced = nextOccurrence(nextDate, rule.frequency)
      if (advanced <= nextDate) break
      nextDate = advanced
      hops += 1
    }
  }

  const ended = Boolean(rule.endDate && nextDate > rule.endDate)
  await updateRecurringRule(id, {
    active: ended ? false : active,
    nextDate,
  })
}

export async function deleteRecurringRule(id: string): Promise<void> {
  await db.recurringRules.delete(id)
}

export function useMonthlyReviews() {
  return useLiveQuery(() => db.monthlyReviews.orderBy('month').reverse().toArray(), [])
}

export function useMonthlyReview(month: string) {
  return useLiveQuery(() => db.monthlyReviews.get(month), [month])
}

export async function completeMonthlyReview(input: {
  month: string
  note?: string
}): Promise<MonthlyReview> {
  const review: MonthlyReview = {
    id: input.month,
    month: input.month,
    note: input.note?.trim() || undefined,
    completedAt: new Date().toISOString(),
  }
  await db.monthlyReviews.put(review)
  return review
}

export async function getImportRules(): Promise<ImportRule[]> {
  return db.importRules.toArray()
}

export async function upsertImportRules(
  rules: Array<{ keyword: string; categoryId: string }>,
): Promise<void> {
  if (rules.length === 0) return
  const existing = await db.importRules.toArray()
  const byKeyword = new Map(existing.map((rule) => [rule.keyword, rule]))
  const now = new Date().toISOString()
  const rows: ImportRule[] = []

  for (const rule of rules) {
    const keyword = rule.keyword.trim()
    if (!keyword) continue
    const previous = byKeyword.get(keyword)
    if (previous) {
      rows.push({ ...previous, categoryId: rule.categoryId })
    } else {
      rows.push({
        id: crypto.randomUUID(),
        keyword,
        categoryId: rule.categoryId,
        createdAt: now,
      })
    }
  }

  if (rows.length > 0) await db.importRules.bulkPut(rows)
}
