import { formatISO, isValid, parse, parseISO } from 'date-fns'

const DATE_FORMATS = [
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'dd.MM.yyyy',
  'dd/MM/yy',
  'dd-MM-yy',
  'dd.MM.yy',
  'dd MMM yyyy',
  'dd MMMM yyyy',
  'd MMMM yyyy',
  'dd-MMM-yyyy',
  'dd MMM yy',
  'd/M/yyyy',
  'd-M-yyyy',
  'd/M/yy',
  'yyyy/MM/dd',
]

export function parseStatementDate(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const iso = parseISO(value.slice(0, 10))
    if (isValid(iso) && inRange(iso)) return formatISO(iso, { representation: 'date' })
  }

  for (const format of DATE_FORMATS) {
    const parsed = parse(value, format, new Date())
    if (isValid(parsed) && inRange(parsed)) {
      return formatISO(parsed, { representation: 'date' })
    }
  }

  const serial = Number(value)
  if (Number.isInteger(serial) && serial > 20000 && serial < 80000) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    const parsed = new Date(excelEpoch + serial * 86400000)
    if (isValid(parsed) && inRange(parsed)) {
      return formatISO(parsed, { representation: 'date' })
    }
  }

  return null
}

function inRange(date: Date): boolean {
  const year = date.getFullYear()
  return year >= 1970 && year <= 2100
}
