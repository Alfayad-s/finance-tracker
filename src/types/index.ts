export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'
export type Theme = 'light'
export type FirstDayOfWeek = 0 | 1
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  date: string
  note?: string
  paymentMethod?: string
  isRecurring?: boolean
  recurringId?: string
  receiptPhoto?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  isDefault: boolean
  order: number
}

export interface Budget {
  id: string
  month: string
  categoryId: string | null
  amount: number
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  color: string
  icon: string
  deadline?: string
  createdAt: string
}

export interface RecurringRule {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  note?: string
  frequency: RecurringFrequency
  startDate: string
  nextDate: string
  endDate?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface MonthlyReview {
  id: string
  month: string
  note?: string
  completedAt: string
}

export interface Settings {
  id: 'app'
  currency: string
  theme: Theme
  firstDayOfWeek: FirstDayOfWeek
  softInsightsEnabled: boolean
  displayName: string
  avatarId: number
  language?: string
  pinHash?: string
  pinSalt?: string
  webauthnCredentialId?: string
  hideAmounts?: boolean
}

export interface ImportRule {
  id: string
  keyword: string
  categoryId: string
  createdAt: string
}
