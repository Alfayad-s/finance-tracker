import {
  getDocument,
  GlobalWorkerOptions,
  PasswordException,
  PasswordResponses,
} from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseStatementDate } from './dates'
import { PdfPasswordError } from './parseErrors'
import { prepareRows } from './presets'
import type { BankPresetId } from './types'

GlobalWorkerOptions.workerSrc = workerUrl

export { PdfPasswordError }

interface Token {
  str: string
  x: number
  width: number
}

interface Line {
  y: number
  tokens: Token[]
}

export async function preparePdf(
  data: ArrayBuffer,
  filename: string,
  password?: string,
  preferredPreset?: BankPresetId | null,
): Promise<ReturnType<typeof prepareRows>> {
  const { rows, hint } = await extractPdfTable(data, password)
  try {
    return prepareRows(rows, filename, 'pdf', preferredPreset ?? hint)
  } catch {
    throw new Error(
      'Could not read a transaction table in that PDF. Try a CSV export from netbanking.',
    )
  }
}

async function extractPdfTable(
  data: ArrayBuffer,
  password?: string,
): Promise<{ rows: string[][]; hint: BankPresetId | null }> {
  const loadingTask = getDocument({
    data: new Uint8Array(data),
    password,
    useSystemFonts: true,
  })

  try {
    const document = await loadingTask.promise
    const lines: Line[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      lines.push(...itemsToLines(content.items))
    }

    const text = lines.map((line) => line.tokens.map((token) => token.str).join(' ')).join('\n')
    if (text.replace(/\s+/g, '').length < 40) {
      throw new Error(
        'This PDF has no readable text. Scanned image statements cannot be imported. Use a CSV or a text PDF.',
      )
    }

    const positional = tableFromLines(lines)
    const spaced = spaceSplitLines(lines)
    const rows = denserTable(positional, spaced)
    return { rows, hint: bankHintFromText(text) }
  } catch (caught) {
    throw toPdfError(caught)
  } finally {
    await loadingTask.destroy()
  }
}

function toPdfError(caught: unknown): Error {
  if (isPasswordException(caught)) {
    return new PdfPasswordError(caught.code === PasswordResponses.INCORRECT_PASSWORD)
  }
  if (caught instanceof PdfPasswordError) return caught
  if (caught instanceof Error) return caught
  return new Error('Could not read that PDF')
}

function isPasswordException(value: unknown): value is { code: number } {
  if (value instanceof PasswordException) return true
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    (value as { name: unknown }).name === 'PasswordException'
  )
}

function itemsToLines(items: unknown[]): Line[] {
  const buckets = new Map<number, Token[]>()
  for (const item of items) {
    if (!isTextItem(item) || !item.str.trim()) continue
    const x = item.transform[4] ?? 0
    const y = Math.round((item.transform[5] ?? 0) / 3) * 3
    const bucket = buckets.get(y) ?? []
    bucket.push({ str: item.str.trim(), x, width: item.width || item.str.length * 4 })
    buckets.set(y, bucket)
  }

  return [...buckets.entries()]
    .toSorted((left, right) => right[0] - left[0])
    .map(([y, tokens]) => ({ y, tokens: mergeTokens(tokens) }))
    .filter((line) => line.tokens.length > 0)
}

function mergeTokens(tokens: Token[]): Token[] {
  const sorted = tokens.toSorted((left, right) => left.x - right.x)
  const merged: Token[] = []
  for (const token of sorted) {
    const last = merged.at(-1)
    const gap = last ? token.x - (last.x + last.width) : Infinity
    if (last && gap < 6) {
      const joiner = gap < 1.2 ? '' : ' '
      last.str = `${last.str}${joiner}${token.str}`.replace(/\s+/g, ' ').trim()
      last.width = token.x + token.width - last.x
    } else {
      merged.push({ ...token })
    }
  }
  return merged
}

function tableFromLines(lines: Line[]): string[][] {
  const header = findHeaderLine(lines)
  if (!header) {
    return lines.map((line) => line.tokens.map((token) => token.str))
  }

  const columns = header.tokens.map((token) => token.x)
  const rows: string[][] = [header.tokens.map((token) => token.str)]
  const headerIndex = lines.indexOf(header)

  for (const line of lines.slice(headerIndex + 1)) {
    const cells = Array.from({ length: columns.length }, () => '')
    for (const token of line.tokens) {
      const index = nearestColumn(token.x, columns)
      cells[index] = cells[index] ? `${cells[index]} ${token.str}` : token.str
    }
    if (isNoiseRow(cells) || isSameHeader(cells, rows[0])) continue
    if (!rowHasDate(cells) && rows.length > 1) {
      const previous = rows.at(-1)!
      const descriptionIndex = Math.min(1, previous.length - 1)
      previous[descriptionIndex] = [previous[descriptionIndex], cells.filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' ')
      continue
    }
    if (cells.some((cell) => cell !== '')) rows.push(cells)
  }

  return rows
}

function spaceSplitLines(lines: Line[]): string[][] {
  return lines
    .map((line) =>
      line.tokens
        .map((token) => token.str)
        .join('  ')
        .split(/\s{2,}/)
        .map((cell) => cell.trim())
        .filter(Boolean),
    )
    .filter((row) => row.length > 0 && !isNoiseRow(row))
}

function denserTable(left: string[][], right: string[][]): string[][] {
  const leftAvg = averageWidth(left)
  const rightAvg = averageWidth(right)
  if (leftAvg >= 3) return left
  if (rightAvg > leftAvg) return right
  return left.length >= right.length ? left : right
}

function averageWidth(rows: string[][]): number {
  if (rows.length === 0) return 0
  return rows.reduce((sum, row) => sum + row.length, 0) / rows.length
}

function findHeaderLine(lines: Line[]): Line | undefined {
  return lines.slice(0, 60).find((line) => {
    const cells = line.tokens.map((token) => token.str.toLowerCase())
    const joined = cells.join(' ')
    const hasDate = cells.some((cell) => cell.includes('date') || cell.includes('txn') || cell === 'dt')
    const hasAmount =
      joined.includes('withdrawal') ||
      joined.includes('deposit') ||
      joined.includes('debit') ||
      joined.includes('credit') ||
      joined.includes('amount')
    return line.tokens.length >= 3 && hasDate && hasAmount
  })
}

function nearestColumn(x: number, columns: number[]): number {
  let best = 0
  let bestDistance = Infinity
  for (let index = 0; index < columns.length; index += 1) {
    const distance = Math.abs(x - columns[index]!)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  }
  return best
}

function rowHasDate(row: string[]): boolean {
  return row.some((cell) => parseStatementDate(cell))
}

function isSameHeader(row: string[], header: string[]): boolean {
  if (row.length !== header.length) return false
  return row.every(
    (cell, index) => cell.trim().toLowerCase() === header[index]?.trim().toLowerCase(),
  )
}

function isNoiseRow(row: string[]): boolean {
  const text = row.join(' ').toLowerCase()
  return (
    /page\s+\d+(\s+of\s+\d+)?/.test(text) ||
    /^www\./.test(text) ||
    text.includes('this is a computer generated') ||
    text.includes('registered office')
  )
}

function bankHintFromText(text: string): BankPresetId | null {
  const sample = text.slice(0, 5000).toLowerCase()
  if (
    sample.includes('supermoney') ||
    (sample.includes('transaction history') && sample.includes('status') && sample.includes('name'))
  ) {
    return 'supermoney'
  }
  if (sample.includes('hdfc')) return 'hdfc'
  if (sample.includes('state bank') || /\bsbi\b/.test(sample)) return 'sbi'
  if (sample.includes('icici')) return 'icici'
  if (sample.includes('axis bank') || /\baxis\b/.test(sample)) return 'axis'
  if (sample.includes('kotak')) return 'kotak'
  return null
}

function isTextItem(
  item: unknown,
): item is { str: string; transform: number[]; width: number } {
  if (typeof item !== 'object' || item === null) return false
  const record = item as Record<string, unknown>
  return typeof record.str === 'string' && Array.isArray(record.transform)
}
