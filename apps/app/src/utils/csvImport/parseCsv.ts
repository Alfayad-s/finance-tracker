export function parseCsvText(text: string): { rows: string[][]; delimiter: string } {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!source.trim()) {
    throw new Error('That file is empty')
  }
  const delimiter = sniffDelimiter(source)
  return { rows: parseRows(source, delimiter), delimiter }
}

function sniffDelimiter(source: string): string {
  const sample = source.split('\n').slice(0, 20)
  let best = ','
  let bestScore = -1
  for (const delimiter of [',', ';', '\t'] as const) {
    const counts = sample.map((line) => countUnquoted(line, delimiter)).filter((count) => count > 0)
    if (counts.length === 0) continue
    const average = counts.reduce((sum, count) => sum + count, 0) / counts.length
    const variance =
      counts.reduce((sum, count) => sum + (count - average) ** 2, 0) / counts.length
    const score = average * 8 - variance + counts.length
    if (score > bestScore) {
      bestScore = score
      best = delimiter
    }
  }
  return best
}

function countUnquoted(line: string, delimiter: string): number {
  let count = 0
  let inQuotes = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        index += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && char === delimiter) count += 1
  }
  return count
}

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let index = 0

  while (index < text.length) {
    const char = text[index]
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      cell += char
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      index += 1
      continue
    }
    if (char === delimiter) {
      row.push(cell.trim())
      cell = ''
      index += 1
      continue
    }
    if (char === '\n') {
      row.push(cell.trim())
      cell = ''
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      index += 1
      continue
    }
    cell += char
    index += 1
  }

  row.push(cell.trim())
  if (row.some((value) => value !== '')) rows.push(row)
  return rows
}
