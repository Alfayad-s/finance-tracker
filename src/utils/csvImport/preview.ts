import type { Category, ImportRule, Transaction, TransactionType } from '@/types'
import { merchantKey, suggestCategoryId } from './categoryHints'
import { fingerprintsFrom, transactionFingerprint } from './fingerprint'
import type { MappedRow } from './types'

export interface PreviewRow {
  id: string
  sourceIndex: number
  date: string
  amount: number
  type: TransactionType
  note: string
  categoryId: string
  selected: boolean
  duplicate: boolean
  invalidReason?: string
  merchantKey: string
}

export function buildPreviewRows(
  mapped: MappedRow[],
  categories: Category[],
  existing: Transaction[],
  rules: ImportRule[],
): PreviewRow[] {
  const seen = fingerprintsFrom(existing)
  return mapped.map((row) => {
    const key = merchantKey(row.note)
    if (row.invalidReason) {
      return {
        id: crypto.randomUUID(),
        sourceIndex: row.sourceIndex,
        date: row.date,
        amount: row.amount,
        type: row.type,
        note: row.note,
        categoryId: suggestCategoryId(row.note, row.type, categories, rules, row.categoryName),
        selected: false,
        duplicate: false,
        invalidReason: row.invalidReason,
        merchantKey: key,
      }
    }

    const fingerprint = transactionFingerprint(row.date, row.type, row.amount, row.note)
    const duplicate = seen.has(fingerprint)
    seen.add(fingerprint)

    return {
      id: crypto.randomUUID(),
      sourceIndex: row.sourceIndex,
      date: row.date,
      amount: row.amount,
      type: row.type,
      note: row.note,
      categoryId: suggestCategoryId(row.note, row.type, categories, rules, row.categoryName),
      selected: !duplicate,
      duplicate,
      merchantKey: key,
    }
  })
}
