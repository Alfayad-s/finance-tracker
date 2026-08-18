import type {
  Budget,
  Category,
  Goal,
  MonthlyReview,
  RecurringRule,
  Settings,
  Transaction,
} from '@/types'
import { SETTINGS_ID } from '@/db/constants'
import { DEFAULT_SETTINGS } from '@/db/seed'

export const BACKUP_APP = 'finance-tracker'
export const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  goals: Goal[]
  recurringRules: RecurringRule[]
  monthlyReviews: MonthlyReview[]
  settings: Settings
}

export function buildBackup(input: Omit<BackupFile, 'app' | 'version' | 'exportedAt'>): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...input,
  }
}

export function parseBackup(raw: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new Error('That file is not valid JSON')
  }

  if (!isRecord(parsed)) {
    throw new Error('That file is not a Finance Tracker backup')
  }
  if (parsed.app !== BACKUP_APP) {
    throw new Error('That file is not a Finance Tracker backup')
  }

  const categories = asArray<Category>(parsed.categories)
  if (categories.length === 0) {
    throw new Error('That backup has no categories')
  }

  const settings = normalizeSettings(parsed.settings)

  return {
    app: BACKUP_APP,
    version: typeof parsed.version === 'number' ? parsed.version : BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    transactions: asArray<Transaction>(parsed.transactions).filter(isTransaction),
    categories,
    budgets: asArray<Budget>(parsed.budgets).filter(isBudget),
    goals: asArray<Goal>(parsed.goals).filter(isGoal),
    recurringRules: asArray<RecurringRule>(parsed.recurringRules),
    monthlyReviews: asArray<MonthlyReview>(parsed.monthlyReviews),
    settings,
  }
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: Category[],
): string {
  const names = new Map(categories.map((category) => [category.id, category.name]))
  const header = ['date', 'type', 'amount', 'category', 'note']
  const rows = transactions
    .toSorted((left, right) => left.date.localeCompare(right.date) || left.createdAt.localeCompare(right.createdAt))
    .map((transaction) => [
      transaction.date,
      transaction.type,
      String(transaction.amount),
      names.get(transaction.categoryId) ?? '',
      transaction.note ?? '',
    ])

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    (value.type === 'income' || value.type === 'expense') &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    typeof value.categoryId === 'string' &&
    typeof value.date === 'string'
  )
}

function isBudget(value: unknown): value is Budget {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.month === 'string' &&
    typeof value.amount === 'number' &&
    (value.categoryId === null || typeof value.categoryId === 'string')
  )
}

function isGoal(value: unknown): value is Goal {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.targetAmount === 'number' &&
    typeof value.currentAmount === 'number'
  )
}

function normalizeSettings(value: unknown): Settings {
  const current = isRecord(value) ? value : {}
  return {
    id: SETTINGS_ID,
    currency: typeof current.currency === 'string' ? current.currency : DEFAULT_SETTINGS.currency,
    theme: 'light',
    firstDayOfWeek:
      current.firstDayOfWeek === 0 || current.firstDayOfWeek === 1
        ? current.firstDayOfWeek
        : DEFAULT_SETTINGS.firstDayOfWeek,
    softInsightsEnabled:
      typeof current.softInsightsEnabled === 'boolean'
        ? current.softInsightsEnabled
        : DEFAULT_SETTINGS.softInsightsEnabled,
    language: typeof current.language === 'string' ? current.language : undefined,
  }
}
