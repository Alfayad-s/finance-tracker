import { PdfPasswordError, preparePdf } from './pdfStatement'
import { prepareSpreadsheet, isSpreadsheetFile } from './xlsxStatement'
import { prepareCsv } from './presets'
import type { BankPresetId, ColumnMapping, ParsedCsv } from './types'

export { PdfPasswordError }

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export async function parseStatementFile(
  file: File,
  password?: string,
): Promise<{
  csv: ParsedCsv
  presetId: BankPresetId
  mapping: ColumnMapping
}> {
  if (isPdfFile(file)) {
    const data = await file.arrayBuffer()
    return preparePdf(data, file.name, password)
  }

  if (isSpreadsheetFile(file)) {
    const data = await file.arrayBuffer()
    return prepareSpreadsheet(data, file.name)
  }

  const text = await file.text()
  return prepareCsv(text, file.name)
}
