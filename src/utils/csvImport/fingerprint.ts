import type { Transaction, TransactionType } from '@/types'

export function transactionFingerprint(
  date: string,
  type: TransactionType,
  amount: number,
  note: string,
): string {
  const paise = Math.round(Math.abs(amount) * 100)
  const normalized = note.trim().replace(/\s+/g, ' ').toUpperCase()
  return `${date}|${type}|${paise}|${normalized}`
}

export function fingerprintsFrom(transactions: Transaction[]): Set<string> {
  return new Set(
    transactions.map((transaction) =>
      transactionFingerprint(
        transaction.date,
        transaction.type,
        transaction.amount,
        transaction.note ?? '',
      ),
    ),
  )
}
