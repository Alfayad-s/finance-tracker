import { parseAmount, parseDrCr, parseTypeCell, roundMoney } from './amounts'
import { parseStatementDate } from './dates'
import type { ColumnMapping, MappedRow, ParsedCsv } from './types'
import type { TransactionType } from '@/types'

const JUNK = [
  /opening\s+balance/i,
  /closing\s+balance/i,
  /\bb\/f\b/i,
  /\bc\/f\b/i,
  /brought\s+forward/i,
  /carried\s+forward/i,
  /^\s*totals?\s*$/i,
  /^\s*total\b/i,
]

export function mapStatementRows(csv: ParsedCsv, mapping: ColumnMapping): MappedRow[] {
  return csv.rows.map((row, sourceIndex) => mapRow(row, sourceIndex, mapping))
}

function mapRow(row: string[], sourceIndex: number, mapping: ColumnMapping): MappedRow {
  const dateRaw = cell(row, mapping.date)
  const note = cell(row, mapping.description)
  const categoryName = cell(row, mapping.category) || undefined
  const joined = row.join(' ')

  if (isJunk(note) || isJunk(joined)) {
    return invalid(sourceIndex, dateRaw, note, 'Balance or total row')
  }

  const date = parseStatementDate(dateRaw)
  if (!date) {
    return invalid(sourceIndex, dateRaw, note, 'Could not read the date')
  }

  const parsed = resolveAmount(row, mapping)
  if (!parsed) {
    return invalid(sourceIndex, date, note, 'Could not read the amount', date)
  }

  return {
    sourceIndex,
    date,
    amount: parsed.amount,
    type: parsed.type,
    note,
    categoryName,
  }
}

function resolveAmount(
  row: string[],
  mapping: ColumnMapping,
): { amount: number; type: TransactionType } | null {
  const debit = mapping.debit != null ? parseAmount(cell(row, mapping.debit)) : null
  const credit = mapping.credit != null ? parseAmount(cell(row, mapping.credit)) : null

  if (debit && credit) return null
  if (debit) return { amount: roundMoney(debit.value), type: 'expense' }
  if (credit) return { amount: roundMoney(credit.value), type: 'income' }

  const amountRaw = cell(row, mapping.amount)
  const parsed = amountRaw ? parseAmount(amountRaw) : null
  if (!parsed) return null

  const fromDrCr = mapping.drCr != null ? parseDrCr(cell(row, mapping.drCr)) : null
  const fromType = mapping.type != null ? parseTypeCell(cell(row, mapping.type)) : null
  const fromHint = parsed.hint === 'cr' ? 'income' : parsed.hint === 'dr' ? 'expense' : null
  const type = fromType ?? fromDrCr ?? fromHint ?? 'expense'

  return { amount: roundMoney(parsed.value), type }
}

function cell(row: string[], index: number | null): string {
  if (index == null) return ''
  return row[index] ?? ''
}

function isJunk(value: string): boolean {
  return JUNK.some((pattern) => pattern.test(value))
}

function invalid(
  sourceIndex: number,
  dateRaw: string,
  note: string,
  invalidReason: string,
  date?: string,
): MappedRow {
  return {
    sourceIndex,
    date: date ?? dateRaw,
    amount: 0,
    type: 'expense',
    note,
    invalidReason,
  }
}
