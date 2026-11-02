import { AppError } from '../lib/errors'
import { baseName, formatBytes, sanitizeFilename, type OutputFile } from '../lib/files'
import type { OptionValues } from './types'

function text(options: OptionValues, id: string, fallback = ''): string {
  const value = options[id]
  return typeof value === 'string' ? value : fallback
}

function flag(options: OptionValues, id: string, fallback = false): boolean {
  const value = options[id]
  return typeof value === 'boolean' ? value : fallback
}

function number(options: OptionValues, id: string, fallback: number): number {
  const value = Number(options[id])
  return Number.isFinite(value) ? value : fallback
}

function pdfName(file: File, suffix: string): string {
  return `${sanitizeFilename(baseName(file.name))}${suffix}.pdf`
}

/**
 * Conversion libraries are loaded on demand so the initial page (hero, tool
 * grid) stays light and each engine only downloads when it is actually used.
 */
export async function runTool(
  toolId: string,
  files: File[],
  options: OptionValues,
  onProgress: (percent: number) => void,
  language: 'tr' | 'en' = 'tr',
): Promise<OutputFile[]> {
  if (files.length === 0) throw new AppError('noFiles')
  const first = files[0]
  const pageSpec = text(options, 'pageRange')

  switch (toolId) {
    case 'pdf-to-word': {
      const { pdfToDocx } = await import('../lib/pdfToDocx')
      const blob = await pdfToDocx(first, {
        pageSpec,
        detectHeadings: flag(options, 'detectHeadings', true),
        onProgress,
      })
      return [{ name: `${sanitizeFilename(baseName(first.name))}.docx`, blob }]
    }

    case 'word-to-pdf': {
      const { docxToPdf } = await import('../lib/docxToPdf')
      const blob = await docxToPdf(first, {
        orientation: text(options, 'orientation', 'portrait') as 'portrait' | 'landscape',
        onProgress,
      })
      return [{ name: pdfName(first, ''), blob }]
    }

    case 'pdf-to-jpg': {
      const { pdfToImages } = await import('../lib/pdf')
      const quality = text(options, 'quality', 'high')
      return pdfToImages(first, {
        format: 'jpeg',
        scale: number(options, 'scale', 2),
        quality: quality === 'high' ? 0.92 : quality === 'medium' ? 0.8 : 0.65,
        pageSpec,
        onProgress,
      })
    }

    case 'pdf-to-png': {
      const { pdfToImages } = await import('../lib/pdf')
      return pdfToImages(first, {
        format: 'png',
        scale: number(options, 'scale', 2),
        pageSpec,
        onProgress,
      })
    }

    case 'images-to-pdf': {
      const { imagesToPdf } = await import('../lib/imageTools')
      const blob = await imagesToPdf(files, {
        pageSize: text(options, 'pageSize', 'a4') as 'auto' | 'a4' | 'letter',
        orientation: text(options, 'orientation', 'auto') as 'auto' | 'portrait' | 'landscape',
        margin: text(options, 'margin', 'small') as 'none' | 'small' | 'normal',
        onProgress,
      })
      const name =
        files.length === 1
          ? pdfName(first, '')
          : `${sanitizeFilename(baseName(first.name))}-images.pdf`
      return [{ name, blob }]
    }

    case 'merge-pdf': {
      const { mergePdfs } = await import('../lib/pdf')
      const blob = await mergePdfs(files, onProgress)
      return [{ name: `${sanitizeFilename(baseName(first.name))}-merged.pdf`, blob }]
    }

    case 'split-pdf': {
      const { splitPdf } = await import('../lib/pdf')
      return splitPdf(
        first,
        text(options, 'splitMode', 'each') as 'each' | 'range',
        pageSpec,
        onProgress,
      )
    }

    case 'rotate-pdf': {
      const { rotatePdf } = await import('../lib/pdf')
      const blob = await rotatePdf(first, number(options, 'angle', 90), pageSpec, onProgress)
      return [{ name: pdfName(first, '-rotated'), blob }]
    }

    case 'compress-pdf': {
      const { compressPdf } = await import('../lib/pdf')
      const result = await compressPdf(
        first,
        text(options, 'quality', 'ebook') as 'screen' | 'ebook' | 'print',
        onProgress,
      )
      return [
        {
          name: pdfName(first, '-compressed'),
          blob: result.blob,
          note: `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}`,
        },
      ]
    }

    case 'pdf-to-text': {
      const { pdfToText } = await import('../lib/text')
      return [
        await pdfToText(first, {
          pageSpec,
          includeMarkers: flag(options, 'includeMarkers', true),
          pageLabel: (pageNumber) =>
            language === 'en' ? `Page ${pageNumber}` : `${pageNumber}. Sayfa`,
          onProgress,
        }),
      ]
    }

    case 'pdf-to-excel': {
      const { extractPdfTable } = await import('../lib/pdf')
      const { spreadsheetName, tablesToExcel } = await import('../lib/spreadsheet')
      const tables = await extractPdfTable(
        first,
        pageSpec,
        flag(options, 'splitColumns', true),
        (percent) => onProgress(Math.round(percent * 0.8)),
      )
      const blob = tablesToExcel(tables, first.name)
      onProgress(100)
      return [{ name: spreadsheetName(first.name), blob }]
    }

    case 'excel-to-csv': {
      const { excelToCsv } = await import('../lib/spreadsheet')
      return excelToCsv(files, {
        allSheets: flag(options, 'allSheets', true),
        delimiter: text(options, 'delimiter', 'comma') as 'auto' | 'comma' | 'semicolon' | 'tab',
        onProgress,
      })
    }

    case 'csv-to-excel': {
      const { csvToExcel } = await import('../lib/spreadsheet')
      const blob = await csvToExcel(files, {
        delimiter: text(options, 'delimiter', 'auto') as 'auto' | 'comma' | 'semicolon' | 'tab',
        onProgress,
      })
      const name =
        files.length === 1
          ? `${sanitizeFilename(baseName(first.name))}.xlsx`
          : 'fileforge-workbook.xlsx'
      return [{ name, blob }]
    }

    case 'excel-to-pdf': {
      const { excelToPdf } = await import('../lib/spreadsheet')
      return excelToPdf(files, {
        orientation: text(options, 'orientation', 'landscape') as 'portrait' | 'landscape',
        onProgress,
      })
    }

    case 'text-to-pdf': {
      const { textToPdf } = await import('../lib/text')
      const blob = await textToPdf(first, {
        fontSize: number(options, 'fontSize', 11),
        pageSize: text(options, 'pageSize', 'a4') as 'a4' | 'letter',
        onProgress,
      })
      return [{ name: pdfName(first, ''), blob }]
    }

    default:
      throw new AppError('unsupported')
  }
}
