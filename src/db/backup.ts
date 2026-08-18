import { db } from './db'
import { buildBackup, type BackupFile } from '@/utils/backup'

export async function readBackup(): Promise<BackupFile> {
  const [
    transactions,
    categories,
    budgets,
    goals,
    recurringRules,
    monthlyReviews,
    settings,
  ] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.goals.toArray(),
    db.recurringRules.toArray(),
    db.monthlyReviews.toArray(),
    db.settings.toArray(),
  ])

  const appSettings = settings[0]
  if (!appSettings) {
    throw new Error('Settings are missing on this device')
  }

  return buildBackup({
    transactions,
    categories,
    budgets,
    goals,
    recurringRules,
    monthlyReviews,
    settings: appSettings,
  })
}

export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.transactions,
      db.categories,
      db.budgets,
      db.goals,
      db.recurringRules,
      db.monthlyReviews,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.recurringRules.clear(),
        db.monthlyReviews.clear(),
        db.settings.clear(),
      ])

      await db.categories.bulkPut(backup.categories)
      if (backup.transactions.length > 0) await db.transactions.bulkPut(backup.transactions)
      if (backup.budgets.length > 0) await db.budgets.bulkPut(backup.budgets)
      if (backup.goals.length > 0) await db.goals.bulkPut(backup.goals)
      if (backup.recurringRules.length > 0) await db.recurringRules.bulkPut(backup.recurringRules)
      if (backup.monthlyReviews.length > 0) await db.monthlyReviews.bulkPut(backup.monthlyReviews)
      await db.settings.put(backup.settings)
    },
  )
}
