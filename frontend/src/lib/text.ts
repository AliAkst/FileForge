import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import { AppError } from './errors'
import { baseName, blobFromBytes, sanitizeFilename, tick, type OutputFile } from './files'
import { loadFonts } from './font'
import { extractPdfPages } from './pdf'

export interface TextToPdfOptions {
  fontSize?: number
  pageSize?: 'a4' | 'letter'
  onProgress?: (percent: number) => void
}

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
}

function wrapLine(
  text: string,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  if (!text) return ['']
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
      continue
    }

    if (current) lines.push(current)

    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let fragment = ''
      for (const character of word) {
        const test = fragment + character
        if (font.widthOfTextAtSize(test, size) > maxWidth && fragment) {
          lines.push(fragment)
          fragment = character
        } else {
          fragment = test
        }
      }
      current = fragment
    } else {
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

export async function textToPdf(file: File, options: TextToPdfOptions = {}): Promise<Blob> {
  options.onProgress?.(8)
  const text = (await file.text()).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!text.trim()) throw new AppError('emptyFile')

  const fonts = await loadFonts()
  options.onProgress?.(22)

  const document = await PDFDocument.create()
  document.registerFontkit(fontkit)
  document.setProducer('FileForge')
  document.setCreator('FileForge — local text to PDF')
  document.setTitle(baseName(file.name))

  const regular = await document.embedFont(fonts.regular, { subset: true })
  const bold = await document.embedFont(fonts.bold, { subset: true })

  const size = options.fontSize ?? 11
  const pageSize = PAGE_SIZES[options.pageSize ?? 'a4']
  const margin = 56
  const maxWidth = pageSize.width - margin * 2
  const lineHeight = size * 1.55
  const paragraphGap = size * 0.75

  let page = document.addPage([pageSize.width, pageSize.height])
  let y = pageSize.height - margin
  let pageCount = 1

  const newPage = () => {
    page = document.addPage([pageSize.width, pageSize.height])
    pageCount += 1
    y = pageSize.height - margin
  }

  const ensureSpace = (height: number) => {
    if (y - height < margin) newPage()
  }

  const paragraphs = text.split('\n')
  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index]
    const trimmed = paragraph.trim()
    const isHeading = trimmed.length > 0 && trimmed.length < 90 && /^[A-Z0-9ÇĞİÖŞÜ][^.!?]*$/.test(trimmed) && trimmed === trimmed.toUpperCase()
    const font = isHeading ? bold : regular
    const fontSize = isHeading ? Math.min(22, size + 3) : size
    const wrappingSize = isHeading ? fontSize : size
    const lines = wrapLine(paragraph, font, wrappingSize, maxWidth)

    for (const line of lines) {
      ensureSpace(lineHeight)
      if (line) {
        page.drawText(line, {
          x: margin,
          y: y - fontSize,
          size: fontSize,
          font,
          color: rgb(0.11, 0.1, 0.09),
        })
      }
      y -= lineHeight
    }

    y -= paragraphGap
    if (index % 50 === 0) {
      options.onProgress?.(22 + Math.round(((index + 1) / paragraphs.length) * 70))
      await tick()
    }
  }

  const bytes = await document.save({ useObjectStreams: true })
  options.onProgress?.(100)
  return blobFromBytes(bytes, 'application/pdf')
}

export interface PdfToTextOptions {
  pageSpec?: string
  includeMarkers?: boolean
  pageLabel?: (pageNumber: number) => string
  onProgress?: (percent: number) => void
}

export async function pdfToText(file: File, options: PdfToTextOptions = {}): Promise<OutputFile> {
  const pages = await extractPdfPages(file, options.pageSpec ?? '', options.onProgress)
  if (pages.every((page) => page.lines.length === 0)) throw new AppError('noText')

  const chunks: string[] = []
  const label = options.pageLabel ?? ((pageNumber: number) => `${pageNumber}. Sayfa`)
  for (const page of pages) {
    if (options.includeMarkers ?? true) {
      chunks.push(`--- ${label(page.pageNumber)} ---`)
    }
    chunks.push(page.lines.map((line) => line.text).join('\n'))
  }

  const text = `\uFEFF${chunks.join('\n\n').trim()}\n`
  return {
    name: `${sanitizeFilename(baseName(file.name))}.txt`,
    blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
  }
}
