import { stripPinLock } from '@/utils/pin'
import { buildBackup, type BackupFile } from '@/utils/backup'
import { SETTINGS_ID } from './constants'
import { db } from './db'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './seed'

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
    settings: stripPinLock(appSettings),
  })
}

export async function restoreBackup(backup: BackupFile): Promise<void> {
  const previous = await db.settings.get(SETTINGS_ID)
  await db.transaction('rw', [...ALL_TABLES], async () => {
    await clearAllTables()

    await db.categories.bulkPut(backup.categories)
    if (backup.transactions.length > 0) await db.transactions.bulkPut(backup.transactions)
    if (backup.budgets.length > 0) await db.budgets.bulkPut(backup.budgets)
    if (backup.goals.length > 0) await db.goals.bulkPut(backup.goals)
    if (backup.recurringRules.length > 0) await db.recurringRules.bulkPut(backup.recurringRules)
    if (backup.monthlyReviews.length > 0) await db.monthlyReviews.bulkPut(backup.monthlyReviews)
    await db.settings.put({
      ...backup.settings,
      ...(previous?.pinHash && previous.pinSalt
        ? { pinHash: previous.pinHash, pinSalt: previous.pinSalt }
        : {}),
      ...(previous?.webauthnCredentialId
        ? { webauthnCredentialId: previous.webauthnCredentialId }
        : {}),
    })
  })
}

const ALL_TABLES = [
  db.transactions,
  db.categories,
  db.budgets,
  db.goals,
  db.recurringRules,
  db.monthlyReviews,
  db.settings,
  db.importRules,
] as const

async function clearAllTables() {
  await Promise.all(ALL_TABLES.map((table) => table.clear()))
}

export async function resetAppData(): Promise<void> {
  await db.transaction('rw', [...ALL_TABLES], async () => {
    await clearAllTables()
    await db.settings.put(DEFAULT_SETTINGS)
    await db.categories.bulkPut(DEFAULT_CATEGORIES)
  })
  try {
    localStorage.removeItem('finance-tracker-install-dismissed')
  } catch {
    /* private mode */
  }
}
