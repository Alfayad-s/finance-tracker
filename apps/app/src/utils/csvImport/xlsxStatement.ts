import { read, utils, type WorkBook } from 'xlsx'
import { prepareRows } from './presets'
import type { BankPresetId } from './types'

export function isSpreadsheetFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type
  return (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsm') ||
    type === 'application/vnd.ms-excel' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
}

export async function prepareSpreadsheet(
  data: ArrayBuffer,
  filename: string,
  preferredPreset?: BankPresetId | null,
): Promise<ReturnType<typeof prepareRows>> {
  const rows = extractSpreadsheetRows(data)
  if (rows.length < 2) {
    throw new Error('That spreadsheet has no transaction rows')
  }
  try {
    return prepareRows(rows, filename, 'xlsx', preferredPreset)
  } catch {
    throw new Error(
      'Could not find date and amount columns in that spreadsheet. Check the sheet or try CSV.',
    )
  }
}

function extractSpreadsheetRows(data: ArrayBuffer): string[][] {
  const htmlRows = rowsFromHtml(decodeText(data))
  if (htmlRows && scoreTable(htmlRows) >= 20) return htmlRows

  try {
    const workbook = readWorkbook(data)
    const sheetRows = rowsFromWorkbook(workbook)
    if (htmlRows && scoreTable(htmlRows) > scoreTable(sheetRows)) return htmlRows
    return sheetRows
  } catch (caught) {
    if (htmlRows && htmlRows.length > 0) return htmlRows
    throw caught instanceof Error ? caught : new Error('Could not read that spreadsheet')
  }
}

function readWorkbook(data: ArrayBuffer): WorkBook {
  try {
    return read(data, { type: 'array', cellDates: true, raw: false })
  } catch {
    return read(decodeText(data), { type: 'string', cellDates: true, raw: false })
  }
}

function rowsFromWorkbook(workbook: WorkBook): string[][] {
  if (workbook.SheetNames.length === 0) {
    throw new Error('That spreadsheet has no sheets')
  }

  let best: string[][] = []
  let bestScore = -1
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    if (!sheet) continue
    const raw = utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    })
    const rows = raw.map((row) => (Array.isArray(row) ? row.map(cellToString) : []))
    const score = scoreTable(rows)
    if (score > bestScore) {
      best = rows
      bestScore = score
    }
  }
  return best
}

function rowsFromHtml(text: string): string[][] | null {
  if (!/<table/i.test(text)) return null
  const document = new DOMParser().parseFromString(text, 'text/html')
  const tables = [...document.querySelectorAll('table')].map((table) =>
    [...table.rows].map((row) =>
      [...row.cells].map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim()),
    ),
  )
  if (tables.length === 0) return null
  return tables.toSorted((left, right) => scoreTable(right) - scoreTable(left))[0] ?? null
}

function cellToString(value: unknown): string {
  if (value == null || value === '') return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}/${value.getFullYear()}`
  }
  return String(value).trim()
}

function scoreTable(rows: string[][]): number {
  const useful = rows.filter((row) => row.filter(Boolean).length >= 3).length
  return useful * 10 + rows.length
}

function decodeText(data: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(data).replace(/^\uFEFF/, '')
}
