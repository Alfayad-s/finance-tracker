import type { Category, Settings } from '@/types'
import { isAvatarId } from '@/components/avatars'
import { SETTINGS_ID } from './constants'
import { db } from './db'

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  currency: 'INR',
  theme: 'light',
  firstDayOfWeek: 1,
  softInsightsEnabled: true,
  displayName: '',
  avatarId: 1,
  hideAmounts: false,
  accountsSetupComplete: false,
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food', icon: 'UtensilsCrossed', color: '#2563eb', type: 'expense', isDefault: true, order: 0 },
  { id: 'cat-transport', name: 'Transport', icon: 'Car', color: '#3b82f6', type: 'expense', isDefault: true, order: 1 },
  { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#1d4ed8', type: 'expense', isDefault: true, order: 2 },
  { id: 'cat-bills', name: 'Bills', icon: 'Receipt', color: '#60a5fa', type: 'expense', isDefault: true, order: 3 },
  { id: 'cat-housing', name: 'Housing', icon: 'House', color: '#1e40af', type: 'expense', isDefault: true, order: 4 },
  { id: 'cat-health', name: 'Health', icon: 'HeartPulse', color: '#38bdf8', type: 'expense', isDefault: true, order: 5 },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'Clapperboard', color: '#6366f1', type: 'expense', isDefault: true, order: 6 },
  { id: 'cat-education', name: 'Education', icon: 'GraduationCap', color: '#0ea5e9', type: 'expense', isDefault: true, order: 7 },
  { id: 'cat-personal', name: 'Personal', icon: 'User', color: '#3b82f6', type: 'expense', isDefault: true, order: 8 },
  { id: 'cat-expense-other', name: 'Other', icon: 'CircleEllipsis', color: '#94a3b8', type: 'expense', isDefault: true, order: 9 },
  { id: 'cat-salary', name: 'Salary', icon: 'Wallet', color: '#1d4ed8', type: 'income', isDefault: true, order: 10 },
  { id: 'cat-freelance', name: 'Freelance', icon: 'Briefcase', color: '#2563eb', type: 'income', isDefault: true, order: 11 },
  { id: 'cat-gift', name: 'Gift', icon: 'Gift', color: '#38bdf8', type: 'income', isDefault: true, order: 12 },
  { id: 'cat-income-other', name: 'Other', icon: 'CirclePlus', color: '#60a5fa', type: 'income', isDefault: true, order: 13 },
]

export async function seedDatabase(): Promise<void> {
  const existingSettings = await db.settings.get(SETTINGS_ID)
  if (!existingSettings) {
    await db.settings.add(DEFAULT_SETTINGS)
  } else {
    const next: Settings = {
      ...existingSettings,
      theme: 'light',
      softInsightsEnabled:
        typeof existingSettings.softInsightsEnabled === 'boolean'
          ? existingSettings.softInsightsEnabled
          : true,
      displayName:
        typeof existingSettings.displayName === 'string' ? existingSettings.displayName : '',
      avatarId: isAvatarId(existingSettings.avatarId) ? existingSettings.avatarId : 1,
      hideAmounts:
        typeof existingSettings.hideAmounts === 'boolean' ? existingSettings.hideAmounts : false,
      accountsSetupComplete:
        typeof existingSettings.accountsSetupComplete === 'boolean'
          ? existingSettings.accountsSetupComplete
          : (await db.transactions.count()) > 0,
    }
    if (
      existingSettings.theme !== next.theme ||
      existingSettings.softInsightsEnabled !== next.softInsightsEnabled ||
      existingSettings.displayName !== next.displayName ||
      existingSettings.avatarId !== next.avatarId ||
      existingSettings.hideAmounts !== next.hideAmounts ||
      existingSettings.accountsSetupComplete !== next.accountsSetupComplete
    ) {
      await db.settings.put(next)
    }
  }

  const categoryCount = await db.categories.count()
  if (categoryCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
    return
  }

  await Promise.all(
    DEFAULT_CATEGORIES.map(async (category) => {
      const existing = await db.categories.get(category.id)
      if (existing?.isDefault) {
        await db.categories.update(category.id, { color: category.color })
      }
    }),
  )
}
