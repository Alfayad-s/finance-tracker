import { parseCsvText } from './parseCsv'
import { EMPTY_MAPPING, type BankPresetId, type ColumnMapping, type ParsedCsv } from './types'

interface PresetDef {
  id: BankPresetId
  label: string
  date: string[]
  description: string[]
  debit: string[]
  credit: string[]
  amount: string[]
  drCr: string[]
  type: string[]
  category: string[]
}

export const BANK_PRESETS: { id: BankPresetId; label: string }[] = [
  { id: 'hdfc', label: 'HDFC' },
  { id: 'sbi', label: 'SBI' },
  { id: 'icici', label: 'ICICI' },
  { id: 'axis', label: 'Axis' },
  { id: 'kotak', label: 'Kotak' },
  { id: 'finance-tracker', label: 'Finance Tracker' },
  { id: 'generic', label: 'Generic' },
]

const DATE_ALIASES = [
  'transaction date',
  'tran date',
  'txn date',
  'txn dt',
  'value date',
  'value dt',
  'date',
]

const DESCRIPTION_ALIASES = [
  'transaction remarks',
  'narration',
  'particulars',
  'description',
  'remarks',
  'details',
  'note',
]

const DEBIT_ALIASES = [
  'withdrawal amount inr',
  'withdrawal amt',
  'withdrawal amount',
  'withdrawals',
  'withdrawal',
  'debit amount',
  'debit amt',
  'debits',
  'debit',
]

const CREDIT_ALIASES = [
  'deposit amount inr',
  'deposit amt',
  'deposit amount',
  'deposits',
  'deposit',
  'credit amount',
  'credit amt',
  'credits',
  'credit',
]

const AMOUNT_ALIASES = ['txn amount', 'transaction amount', 'amount', 'amt']

const DRCR_ALIASES = ['dr cr', 'dr/cr', 'type cr dr', 'debit credit']

const TYPE_ALIASES = ['type']

const CATEGORY_ALIASES = ['category']

const PRESETS: PresetDef[] = [
  {
    id: 'hdfc',
    label: 'HDFC',
    date: ['date'],
    description: ['narration'],
    debit: ['withdrawal amt', 'withdrawal amount'],
    credit: ['deposit amt', 'deposit amount'],
    amount: [],
    drCr: [],
    type: [],
    category: [],
  },
  {
    id: 'sbi',
    label: 'SBI',
    date: ['txn date', 'transaction date', 'date'],
    description: ['description'],
    debit: ['debit'],
    credit: ['credit'],
    amount: [],
    drCr: [],
    type: [],
    category: [],
  },
  {
    id: 'icici',
    label: 'ICICI',
    date: ['transaction date', 'tran date', 'value date'],
    description: ['transaction remarks', 'particulars', 'remarks'],
    debit: ['withdrawal amount inr', 'withdrawal amount', 'debit'],
    credit: ['deposit amount inr', 'deposit amount', 'credit'],
    amount: [],
    drCr: [],
    type: [],
    category: [],
  },
  {
    id: 'axis',
    label: 'Axis',
    date: ['tran date', 'transaction date'],
    description: ['particulars'],
    debit: ['debit'],
    credit: ['credit'],
    amount: [],
    drCr: [],
    type: [],
    category: [],
  },
  {
    id: 'kotak',
    label: 'Kotak',
    date: ['transaction date', 'value date'],
    description: ['description'],
    debit: ['debit'],
    credit: ['credit'],
    amount: ['amount'],
    drCr: ['dr cr'],
    type: [],
    category: [],
  },
  {
    id: 'finance-tracker',
    label: 'Finance Tracker',
    date: ['date'],
    description: ['note'],
    debit: [],
    credit: [],
    amount: ['amount'],
    drCr: [],
    type: ['type'],
    category: ['category'],
  },
  {
    id: 'generic',
    label: 'Generic',
    date: DATE_ALIASES,
    description: DESCRIPTION_ALIASES,
    debit: DEBIT_ALIASES,
    credit: CREDIT_ALIASES,
    amount: AMOUNT_ALIASES,
    drCr: DRCR_ALIASES,
    type: TYPE_ALIASES,
    category: CATEGORY_ALIASES,
  },
]

export function prepareCsv(text: string, filename = ''): {
  csv: ParsedCsv
  presetId: BankPresetId
  mapping: ColumnMapping
} {
  const { rows, delimiter } = parseCsvText(text)
  const { headerRowIndex, presetId } = locateHeader(rows, filename)
  const headers = rows[headerRowIndex] ?? []
  const dataRows = rows.slice(headerRowIndex + 1).filter((row) => row.some((cell) => cell !== ''))
  const csv: ParsedCsv = { delimiter, headerRowIndex, headers, rows: dataRows }
  return { csv, presetId, mapping: mappingFromPreset(headers, presetId) }
}

export function mappingFromPreset(headers: string[], presetId: BankPresetId): ColumnMapping {
  const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS.at(-1)!
  const used = new Set<number>()
  const mapping: ColumnMapping = { ...EMPTY_MAPPING }

  mapping.date = takeColumn(headers, preset.date, used)
  mapping.description = takeColumn(headers, preset.description, used)
  mapping.debit = takeColumn(headers, preset.debit, used)
  mapping.credit = takeColumn(headers, preset.credit, used)
  mapping.amount = takeColumn(headers, preset.amount, used)
  mapping.drCr = takeColumn(headers, preset.drCr, used)
  mapping.type = takeColumn(headers, preset.type, used)
  mapping.category = takeColumn(headers, preset.category, used)

  if (presetId === 'generic') {
    return mappingFromGeneric(headers)
  }
  return mapping
}

export function mappingIsComplete(mapping: ColumnMapping): boolean {
  if (mapping.date == null) return false
  if (mapping.debit != null || mapping.credit != null) return true
  if (mapping.amount != null) return true
  return false
}

function mappingFromGeneric(headers: string[]): ColumnMapping {
  const used = new Set<number>()
  const mapping: ColumnMapping = { ...EMPTY_MAPPING }
  mapping.date = takeColumn(headers, DATE_ALIASES, used)
  mapping.description = takeColumn(headers, DESCRIPTION_ALIASES, used)
  mapping.debit = takeColumn(headers, DEBIT_ALIASES, used)
  mapping.credit = takeColumn(headers, CREDIT_ALIASES, used)
  mapping.drCr = takeColumn(headers, DRCR_ALIASES, used)
  mapping.type = takeColumn(headers, TYPE_ALIASES, used)
  mapping.category = takeColumn(headers, CATEGORY_ALIASES, used)
  if (mapping.debit == null && mapping.credit == null) {
    mapping.amount = takeColumn(headers, AMOUNT_ALIASES, used)
  }
  return mapping
}

function locateHeader(
  rows: string[][],
  filename: string,
): { headerRowIndex: number; presetId: BankPresetId } {
  const hint = hintFromFilename(filename)
  let best: { index: number; presetId: BankPresetId; score: number } | null = null
  const scan = Math.min(rows.length, 40)

  for (let index = 0; index < scan; index += 1) {
    const headers = rows[index]
    if (headers.length < 3) continue
    for (const preset of PRESETS) {
      if (preset.id === 'generic') continue
      let score = scorePreset(headers, preset)
      if (hint === preset.id) score += 5
      if (!best || score > best.score) {
        best = { index, presetId: preset.id, score }
      }
    }
  }

  if (best && best.score >= 8) {
    return { headerRowIndex: best.index, presetId: best.presetId }
  }

  for (let index = 0; index < scan; index += 1) {
    const headers = rows[index]
    if (headers.length < 3) continue
    const generic = mappingFromGeneric(headers)
    if (mappingIsComplete(generic)) {
      return { headerRowIndex: index, presetId: hint ?? 'generic' }
    }
  }

  if (best) return { headerRowIndex: best.index, presetId: best.presetId }
  throw new Error('Could not find a header row with date and amount columns')
}

function scorePreset(headers: string[], preset: PresetDef): number {
  const used = new Set<number>()
  let score = 0
  const roles: (keyof Omit<PresetDef, 'id' | 'label'>)[] = [
    'date',
    'description',
    'debit',
    'credit',
    'amount',
    'drCr',
    'type',
    'category',
  ]
  for (const role of roles) {
    const aliases = preset[role]
    if (aliases.length === 0) continue
    const found = takeColumn(headers, aliases, used)
    if (found != null) {
      score += role === 'date' || role === 'debit' || role === 'credit' || role === 'amount' ? 4 : 2
    }
  }
  return score
}

function hintFromFilename(filename: string): BankPresetId | null {
  const name = filename.toLowerCase()
  if (/\bhdfc\b/.test(name)) return 'hdfc'
  if (/\bsbi\b/.test(name) || /state\s*bank/.test(name)) return 'sbi'
  if (/\bicici\b/.test(name)) return 'icici'
  if (/\baxis\b/.test(name)) return 'axis'
  if (/\bkotak\b/.test(name)) return 'kotak'
  if (/finance[-_ ]?tracker/.test(name)) return 'finance-tracker'
  return null
}

function takeColumn(headers: string[], aliases: string[], used: Set<number>): number | null {
  if (aliases.length === 0) return null
  let best: { index: number; score: number } | null = null
  for (let index = 0; index < headers.length; index += 1) {
    if (used.has(index) || isIgnoredHeader(headers[index])) continue
    for (let aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
      const match = matchScore(headers[index], aliases[aliasIndex])
      if (match <= 0) continue
      const ranked = match * 100 - aliasIndex
      if (!best || ranked > best.score) best = { index, score: ranked }
    }
  }
  if (!best) return null
  used.add(best.index)
  return best.index
}

function isIgnoredHeader(header: string): boolean {
  const normalized = normalizeHeader(header)
  return (
    /\bbalance\b/.test(normalized) ||
    /^(sl|s|sr|si|ref|chq|cheque|cheque no|chq no|ref no)\b/.test(normalized) ||
    normalized === 's no' ||
    normalized === 'sl no'
  )
}

function matchScore(header: string, alias: string): number {
  const normalized = normalizeHeader(header)
  const target = normalizeHeader(alias)
  if (!normalized || !target) return 0
  if (normalized === target) return 3
  if (normalized.startsWith(`${target} `) || target.startsWith(`${normalized} `)) return 2
  if (` ${normalized} `.includes(` ${target} `) && target.length >= 4) return 1
  return 0
}

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[./_\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
