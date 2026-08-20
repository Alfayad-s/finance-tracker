import { PdfPasswordError } from './parseErrors'
import { prepareCsv } from './presets'
import type { BankPresetId, ColumnMapping, ParsedCsv } from './types'

export { PdfPasswordError }

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

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

export async function parseStatementFile(
  file: File,
  password?: string,
  preferredPreset?: BankPresetId | null,
): Promise<{
  csv: ParsedCsv
  presetId: BankPresetId
  mapping: ColumnMapping
}> {
  if (isPdfFile(file)) {
    const { preparePdf } = await import('./pdfStatement')
    const data = await file.arrayBuffer()
    return preparePdf(data, file.name, password, preferredPreset)
  }

  if (isSpreadsheetFile(file)) {
    const { prepareSpreadsheet } = await import('./xlsxStatement')
    const data = await file.arrayBuffer()
    return prepareSpreadsheet(data, file.name, preferredPreset)
  }

  const text = await file.text()
  return prepareCsv(text, file.name, preferredPreset)
}
