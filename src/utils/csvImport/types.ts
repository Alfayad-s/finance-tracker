import type { TransactionType } from '@/types'

export type BankPresetId =
  | 'hdfc'
  | 'sbi'
  | 'icici'
  | 'axis'
  | 'kotak'
  | 'finance-tracker'
  | 'generic'

export interface ColumnMapping {
  date: number | null
  description: number | null
  debit: number | null
  credit: number | null
  amount: number | null
  drCr: number | null
  type: number | null
  category: number | null
}

export interface ParsedCsv {
  delimiter: string
  headerRowIndex: number
  headers: string[]
  rows: string[][]
}

export interface MappedRow {
  sourceIndex: number
  date: string
  amount: number
  type: TransactionType
  note: string
  categoryName?: string
  invalidReason?: string
}

export const EMPTY_MAPPING: ColumnMapping = {
  date: null,
  description: null,
  debit: null,
  credit: null,
  amount: null,
  drCr: null,
  type: null,
  category: null,
}

export const MAPPING_ROLES = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'debit', label: 'Debit / withdrawal' },
  { key: 'credit', label: 'Credit / deposit' },
  { key: 'amount', label: 'Amount' },
  { key: 'drCr', label: 'Dr / Cr' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category' },
] as const
