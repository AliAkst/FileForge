import * as XLSX from 'xlsx'
import { AppError } from './errors'
import { baseName, sanitizeFilename, tick, type OutputFile } from './files'
import { htmlToPdf } from './htmlToPdf'
import type { PageTable } from './pdf'

type Delimiter = 'auto' | 'comma' | 'semicolon' | 'tab'

const DELIMITERS: Record<Exclude<Delimiter, 'auto'>, string> = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
}

function resolveDelimiter(value: Delimiter, sample?: string): string {
  if (value !== 'auto') return DELIMITERS[value]
  if (!sample) return ','
  const firstLine = sample.split(/\r?\n/)[0] ?? ''
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  }
  const winner = (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]
  return winner[1] > 0 ? winner[0] : ','
}

function sheetName(name: string, used: Set<string>): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, '-').slice(0, 28) || 'Sheet'
  let candidate = cleaned
  let index = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${cleaned.slice(0, 25)} ${index}`
    index += 1
  }
  used.add(candidate.toLowerCase())
  return candidate
}

function readWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  try {
    return XLSX.read(buffer, { type: 'array', cellDates: true })
  } catch {
    throw new AppError('noSheets')
  }
}

function applyColumnWidths(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' })
  if (rows.length === 0) return
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const widths: { wch: number }[] = []
  for (let column = 0; column < columnCount; column += 1) {
    let width = 10
    for (let row = 0; row < Math.min(rows.length, 200); row += 1) {
      const value = rows[row]?.[column]
      width = Math.max(width, String(value ?? '').length + 2)
    }
    widths.push({ wch: Math.min(60, width) })
  }
  sheet['!cols'] = widths
}

export interface ExcelToCsvOptions {
  allSheets?: boolean
  delimiter?: Delimiter
  onProgress?: (percent: number) => void
}

export async function excelToCsv(files: File[], options: ExcelToCsvOptions = {}): Promise<OutputFile[]> {
  const outputs: OutputFile[] = []
  const allSheets = options.allSheets ?? true
  const delimiter = options.delimiter ?? 'comma'
  const usedNames = new Set<string>()

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex]
    const workbook = readWorkbook(await file.arrayBuffer())
    const names = allSheets ? workbook.SheetNames : workbook.SheetNames.slice(0, 1)

    if (names.length === 0) throw new AppError('noSheets')
    const nameBase = sanitizeFilename(baseName(file.name))

    for (const name of names) {
      const sheet = workbook.Sheets[name]
      if (!sheet) continue
      const separator = resolveDelimiter(delimiter, '') 
      let csv = XLSX.utils.sheet_to_csv(sheet, { FS: separator, blankrows: false })
      csv = `\uFEFF${csv}`
      const outputName =
        names.length > 1
          ? `${nameBase}-${sanitizeFilename(name)}.csv`
          : `${nameBase}.csv`
      const unique = usedNames.has(outputName)
        ? `${nameBase}-${sanitizeFilename(name)}-${outputs.length + 1}.csv`
        : outputName
      usedNames.add(unique)
      outputs.push({
        name: unique,
        blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      })
    }

    options.onProgress?.(Math.round(((fileIndex + 1) / files.length) * 100))
    await tick()
  }

  return outputs
}

export interface CsvToExcelOptions {
  delimiter?: Delimiter
  onProgress?: (percent: number) => void
}

export async function csvToExcel(files: File[], options: CsvToExcelOptions = {}): Promise<Blob> {
  const workbook = XLSX.utils.book_new()
  const usedNames = new Set<string>()

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const text = await file.text()
    const separator = resolveDelimiter(options.delimiter ?? 'auto', text)
    let parsed: XLSX.WorkBook
    try {
      parsed = XLSX.read(text, { type: 'string', FS: separator, raw: false })
    } catch {
      throw new AppError('noSheets')
    }
    const firstSheetName = parsed.SheetNames[0]
    const sheet = firstSheetName ? parsed.Sheets[firstSheetName] : undefined
    if (!sheet) throw new AppError('noSheets')
    applyColumnWidths(sheet)
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName(baseName(file.name), usedNames))
    options.onProgress?.(Math.round(((index + 1) / files.length) * 96))
    await tick()
  }

  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  options.onProgress?.(100)
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

function workbookToHtml(file: File, workbook: XLSX.WorkBook): string {
  const parts: string[] = [`<h1>${escapeHtml(baseName(file.name))}</h1>`]

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    if (!sheet) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })
    if (rows.length === 0) continue

    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
    const header = rows[0]
    const body = rows.slice(1)

    parts.push(`<h2>${escapeHtml(name)}</h2>`)
    parts.push('<table>')
    if (header.length > 0) {
      parts.push('<thead><tr>')
      for (let column = 0; column < columnCount; column += 1) {
        parts.push(`<th>${escapeHtml(header[column])}</th>`)
      }
      parts.push('</tr></thead>')
    }
    parts.push('<tbody>')
    for (const row of body) {
      parts.push('<tr>')
      for (let column = 0; column < columnCount; column += 1) {
        parts.push(`<td>${escapeHtml(row[column])}</td>`)
      }
      parts.push('</tr>')
    }
    parts.push('</tbody></table>')
  }

  return parts.join('')
}

export interface ExcelToPdfOptions {
  orientation?: 'portrait' | 'landscape'
  onProgress?: (percent: number) => void
}

export async function excelToPdf(files: File[], options: ExcelToPdfOptions = {}): Promise<OutputFile[]> {
  const outputs: OutputFile[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const workbook = readWorkbook(await file.arrayBuffer())
    const html = workbookToHtml(file, workbook)
    const blob = await htmlToPdf(html, {
      orientation: options.orientation ?? 'landscape',
      format: 'a4',
      title: baseName(file.name),
      onProgress: (percent) =>
        options.onProgress?.(
          Math.min(99, Math.round(((index + percent / 100) / files.length) * 100)),
        ),
    })
    outputs.push({
      name: `${sanitizeFilename(baseName(file.name))}.pdf`,
      blob,
    })
    await tick()
  }

  options.onProgress?.(100)
  return outputs
}

export function tablesToExcel(pages: PageTable[], sourceName: string): Blob {
  if (pages.length === 0) throw new AppError('noText')

  const workbook = XLSX.utils.book_new()
  workbook.Props = { Title: sourceName, Author: 'FileForge' }
  const usedNames = new Set<string>()

  for (const page of pages) {
    const columnCount = page.rows.reduce((max, row) => Math.max(max, row.length), 0)
    const rows = page.rows.map((row) => {
      const padded = [...row]
      while (padded.length < columnCount) padded.push('')
      return padded
    })
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    applyColumnWidths(sheet)
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      sheetName(`Page ${page.pageNumber}`, usedNames),
    )
  }

  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function spreadsheetName(sourceName: string): string {
  return `${sanitizeFilename(baseName(sourceName))}.xlsx`
}
