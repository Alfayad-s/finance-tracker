import type { TransactionType } from '@/types'

export function parseAmount(raw: string): { value: number; hint?: 'dr' | 'cr' } | null {
  const original = raw.trim()
  if (!original || original === '-' || original === '--' || original === '.') return null

  let hint: 'dr' | 'cr' | undefined
  if (/\bcr\b/i.test(original) || /cr\s*$/i.test(original)) hint = 'cr'
  if (/\bdr\b/i.test(original) || /dr\s*$/i.test(original)) hint = 'dr'

  const parenNegative = /^\(.*\)$/.test(original)
  const cleaned = original
    .replace(/[₹]/g, '')
    .replace(/\bINR\b/gi, '')
    .replace(/\bRs\.?/gi, '')
    .replace(/\bCR\b/gi, '')
    .replace(/\bDR\b/gi, '')
    .replace(/[()\s]/g, '')
    .replace(/,/g, '')

  if (!cleaned || cleaned === '-') return null
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed) || parsed === 0) return null

  const signed = parenNegative ? -Math.abs(parsed) : parsed
  return { value: signed, hint }
}

export function parseDrCr(raw: string): TransactionType | null {
  const value = raw.trim().toLowerCase()
  if (!value) return null
  if (value === 'dr' || value === 'debit' || value === 'd' || value === 'wd' || value === 'withdrawal') {
    return 'expense'
  }
  if (value === 'cr' || value === 'credit' || value === 'c' || value === 'deposit') {
    return 'income'
  }
  return null
}

export function parseTypeCell(raw: string): TransactionType | null {
  const value = raw.trim().toLowerCase()
  if (!value) return null
  if (value === 'income' || value === 'in' || value === 'credit' || value === 'cr') return 'income'
  if (value === 'expense' || value === 'out' || value === 'debit' || value === 'dr') return 'expense'
  return null
}

export function roundMoney(value: number): number {
  return Math.round(Math.abs(value) * 100) / 100
}
