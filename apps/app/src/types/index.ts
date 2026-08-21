export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'
export type Theme = 'light'
export type FirstDayOfWeek = 0 | 1
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'
export type AccountType = 'bank' | 'credit' | 'cash'

export type CardThemeId = 'mist' | 'night' | 'navy' | 'stone' | 'forest' | 'wine' | 'gold' | 'carbon'
export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'none'
export type BankIssuerId =
  | 'generic'
  | 'hdfc'
  | 'icici'
  | 'sbi'
  | 'axis'
  | 'kotak'
  | 'hsbc'
  | 'chase'
  | 'citi'
  | 'amex'

export interface Account {
  id: string
  name: string
  type: AccountType
  openingBalance: number
  creditLimit?: number
  theme?: CardThemeId
  issuerId?: BankIssuerId
  network?: CardNetwork
  holderName?: string
  last4?: string
  cardNumber?: string
  cvv?: string
  expires?: string
  brandFace?: 'logo' | 'name'
  logoDataUrl?: string
  createdAt: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  date: string
  note?: string
  paymentMethod?: string
  accountId?: string
  transferToAccountId?: string
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
  accountId?: string
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
  accountsSetupComplete?: boolean
}

export interface ImportRule {
  id: string
  keyword: string
  categoryId: string
  createdAt: string
}
