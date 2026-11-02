import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { degrees, PDFDocument } from 'pdf-lib'
import { AppError } from './errors'
import {
  baseName,
  blobFromBytes,
  parsePageGroups,
  parsePageSelection,
  sanitizeFilename,
  tick,
  type OutputFile,
} from './files'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface TextSpan {
  str: string
  x: number
  width: number
  fontSize: number
}

export interface TextLine {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  spans: TextSpan[]
}

export interface PageText {
  pageNumber: number
  width: number
  height: number
  lines: TextLine[]
}

export interface PageTable {
  pageNumber: number
  rows: string[][]
}

interface TextItemLike {
  str: string
  transform: number[]
  width: number
  height: number
}

function isTextItem(item: unknown): item is TextItemLike {
  return typeof item === 'object' && item !== null && 'str' in item && 'transform' in item
}

/**
 * PDF text can contain NUL and other control characters when a font has no
 * valid ToUnicode mapping (for example glyphs such as arrows). Those characters
 * are invalid in DOCX/XLSX XML, so drop them at the source.
 */
function cleanText(value: string): string {
  return value
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\u00a0/g, ' ')
}

function pdfError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error)
  if (/encrypt|password|password/i.test(message)) return new AppError('encrypted')
  return new AppError('invalidPdf', message)
}

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
  try {
    const data = new Uint8Array(await file.arrayBuffer())
    return await pdfjsLib.getDocument({ data, isEvalSupported: false }).promise
  } catch (error) {
    throw pdfError(error)
  }
}

async function pageLines(page: PDFPageProxy): Promise<TextLine[]> {
  const content = await page.getTextContent()
  const items: { str: string; x: number; y: number; width: number; fontSize: number }[] = []

  for (const raw of content.items) {
    if (!isTextItem(raw)) continue
    const str = cleanText(raw.str)
    if (!str.trim()) continue
    const x = raw.transform[4]
    const y = raw.transform[5]
    const fontSize = Math.abs(raw.transform[3]) || raw.height || 10
    const width = raw.width || str.length * fontSize * 0.5
    items.push({ str, x, y, width, fontSize })
  }

  if (items.length === 0) return []

  items.sort((a, b) => (Math.abs(b.y - a.y) > 0.01 ? b.y - a.y : a.x - b.x))

  const grouped: { y: number; fontSize: number; items: typeof items }[] = []
  for (const item of items) {
    const tolerance = Math.max(2.5, item.fontSize * 0.42)
    const line = grouped.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance)
    if (line) {
      line.items.push(item)
      line.fontSize = Math.max(line.fontSize, item.fontSize)
    } else {
      grouped.push({ y: item.y, fontSize: item.fontSize, items: [item] })
    }
  }

  grouped.sort((a, b) => b.y - a.y)

  return grouped
    .map((group) => {
      const sorted = [...group.items].sort((a, b) => a.x - b.x)
      let text = ''
      let previousEnd: number | null = null
      let previousSize = group.fontSize
      for (const item of sorted) {
        if (previousEnd !== null) {
          const gap = item.x - previousEnd
          const needsSpace =
            gap > Math.max(1.2, Math.min(previousSize, item.fontSize) * 0.16) &&
            !text.endsWith(' ') &&
            !item.str.startsWith(' ')
          if (needsSpace) text += ' '
        }
        text += item.str
        previousEnd = item.x + item.width
        previousSize = item.fontSize
      }

      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      return {
        text: text.replace(/\s+/g, ' ').trim(),
        x: first.x,
        y: group.y,
        width: last.x + last.width - first.x,
        fontSize: group.fontSize,
        spans: sorted.map((item) => ({
          str: item.str,
          x: item.x,
          width: item.width,
          fontSize: item.fontSize,
        })),
      }
    })
    .filter((line) => line.text.length > 0)
}

export async function extractPdfPages(
  file: File,
  pageSpec = '',
  onProgress?: (percent: number) => void,
): Promise<PageText[]> {
  const pdf = await loadPdf(file)
  try {
    const indexes = parsePageSelection(pageSpec, pdf.numPages)
    const pages: PageText[] = []
    for (let position = 0; position < indexes.length; position += 1) {
      const pageIndex = indexes[position]
      const page = await pdf.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: 1 })
      const lines = await pageLines(page)
      pages.push({
        pageNumber: pageIndex + 1,
        width: viewport.width,
        height: viewport.height,
        lines,
      })
      page.cleanup()
      onProgress?.(Math.round(((position + 1) / indexes.length) * 100))
      await tick()
    }
    return pages
  } finally {
    await pdf.destroy()
  }
}

export async function extractPdfTable(
  file: File,
  pageSpec = '',
  splitColumns = true,
  onProgress?: (percent: number) => void,
): Promise<PageTable[]> {
  const pdf = await loadPdf(file)
  try {
    const indexes = parsePageSelection(pageSpec, pdf.numPages)
    const pages: PageTable[] = []

    for (let position = 0; position < indexes.length; position += 1) {
      const pageIndex = indexes[position]
      const page = await pdf.getPage(pageIndex + 1)
      const lines = await pageLines(page)
      const rows: string[][] = []

      for (const line of lines) {
        if (!splitColumns) {
          rows.push([line.text])
          continue
        }

        const cells: string[] = []
        let cell = ''
        let previousEnd: number | null = null
        let previousSize = line.fontSize

        for (const span of [...line.spans].sort((a, b) => a.x - b.x)) {
          if (previousEnd === null) {
            cell = span.str
          } else {
            const gap = span.x - previousEnd
            const split = gap > Math.max(9, Math.min(previousSize, span.fontSize) * 0.95)
            if (split) {
              if (cell.trim()) cells.push(cell.trim())
              cell = span.str
            } else {
              const needsSpace =
                gap > Math.max(1.2, Math.min(previousSize, span.fontSize) * 0.16) &&
                !cell.endsWith(' ') &&
                !span.str.startsWith(' ')
              cell += needsSpace ? ` ${span.str}` : span.str
            }
          }
          previousEnd = span.x + span.width
          previousSize = span.fontSize
        }
        if (cell.trim()) cells.push(cell.trim())
        if (cells.length > 0) rows.push(cells)
      }

      if (rows.length > 0) {
        pages.push({ pageNumber: pageIndex + 1, rows })
      }

      page.cleanup()
      onProgress?.(Math.round(((position + 1) / indexes.length) * 100))
      await tick()
    }

    return pages
  } finally {
    await pdf.destroy()
  }
}

export interface RenderOptions {
  format: 'jpeg' | 'png'
  scale: number
  quality?: number
  pageSpec?: string
  onProgress?: (percent: number) => void
}

export async function pdfToImages(file: File, options: RenderOptions): Promise<OutputFile[]> {
  const pdf = await loadPdf(file)
  const outputs: OutputFile[] = []
  const extension = options.format === 'jpeg' ? 'jpg' : 'png'
  const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const nameBase = sanitizeFilename(baseName(file.name))

  try {
    const indexes = parsePageSelection(options.pageSpec ?? '', pdf.numPages)
    for (let position = 0; position < indexes.length; position += 1) {
      const pageIndex = indexes[position]
      const page = await pdf.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: options.scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      const context = canvas.getContext('2d')
      if (!context) throw new AppError('render')

      if (options.format === 'jpeg') {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      await page.render({ canvasContext: context, viewport, background: options.format === 'jpeg' ? '#ffffff' : undefined }).promise

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, options.format === 'jpeg' ? options.quality ?? 0.9 : undefined),
      )
      if (!blob) throw new AppError('render')

      outputs.push({
        name: `${nameBase}-page-${pageIndex + 1}.${extension}`,
        blob,
      })

      page.cleanup()
      options.onProgress?.(Math.round(((position + 1) / indexes.length) * 100))
      await tick()
    }
  } finally {
    await pdf.destroy()
  }

  if (outputs.length === 0) throw new AppError('noTextFound')
  return outputs
}

export interface CompressResult {
  blob: Blob
  originalSize: number
  compressedSize: number
}

export async function compressPdf(
  file: File,
  quality: 'screen' | 'ebook' | 'print',
  onProgress?: (percent: number) => void,
): Promise<CompressResult> {
  const settings = {
    screen: { scale: 1.05, quality: 0.48 },
    ebook: { scale: 1.45, quality: 0.66 },
    print: { scale: 1.9, quality: 0.84 },
  }[quality]

  const source = await loadPdf(file)
  const output = await PDFDocument.create()
  output.setProducer('FileForge')
  output.setCreator('FileForge — local PDF compression')

  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber)
      const baseViewport = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: settings.scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      const context = canvas.getContext('2d')
      if (!context) throw new AppError('render')

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', settings.quality),
      )
      if (!blob) throw new AppError('render')

      const bytes = new Uint8Array(await blob.arrayBuffer())
      const image = await output.embedJpg(bytes)
      const outPage = output.addPage([baseViewport.width, baseViewport.height])
      outPage.drawImage(image, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      })

      page.cleanup()
      onProgress?.(Math.round((pageNumber / source.numPages) * 92))
      await tick()
    }

    const bytes = await output.save({ useObjectStreams: true })
    const generated = blobFromBytes(bytes, 'application/pdf')
    // Rasterization can grow tiny, already-optimized PDFs. In that case keep
    // the original so "compress" never hands back a larger file.
    const blob =
      generated.size < file.size
        ? generated
        : new Blob([await file.arrayBuffer()], { type: 'application/pdf' })
    onProgress?.(100)
    return { blob, originalSize: file.size, compressedSize: blob.size }
  } finally {
    await source.destroy()
  }
}

export async function mergePdfs(files: File[], onProgress?: (percent: number) => void): Promise<Blob> {
  const merged = await PDFDocument.create()
  merged.setProducer('FileForge')
  merged.setCreator('FileForge — local PDF merge')

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      let document: PDFDocument
      try {
        document = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false })
      } catch (error) {
        throw pdfError(error)
      }
      const pages = await merged.copyPages(document, document.getPageIndices())
      pages.forEach((page) => merged.addPage(page))
      onProgress?.(Math.round(((index + 1) / files.length) * 90))
      await tick()
    }

    const bytes = await merged.save({ useObjectStreams: true })
    onProgress?.(100)
    return blobFromBytes(bytes, 'application/pdf')
  } finally {
    // PDF-lib documents do not need explicit cleanup.
  }
}

export async function splitPdf(
  file: File,
  mode: 'each' | 'range',
  pageSpec: string,
  onProgress?: (percent: number) => void,
): Promise<OutputFile[]> {
  let source: PDFDocument
  try {
    source = await PDFDocument.load(await file.arrayBuffer())
  } catch (error) {
    throw pdfError(error)
  }

  const groups =
    mode === 'each'
      ? source.getPageIndices().map((index) => [index])
      : parsePageGroups(pageSpec, source.getPageCount())
  const nameBase = sanitizeFilename(baseName(file.name))
  const outputs: OutputFile[] = []

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index]
    const document = await PDFDocument.create()
    document.setProducer('FileForge')
    const pages = await document.copyPages(source, group)
    pages.forEach((page) => document.addPage(page))
    const bytes = await document.save({ useObjectStreams: true })
    const label =
      group.length === 1
        ? `page-${group[0] + 1}`
        : `pages-${group[0] + 1}-${group[group.length - 1] + 1}`
    outputs.push({
      name: `${nameBase}-${label}.pdf`,
      blob: blobFromBytes(bytes, 'application/pdf'),
    })
    onProgress?.(Math.round(((index + 1) / groups.length) * 100))
    await tick()
  }

  return outputs
}

export async function rotatePdf(
  file: File,
  angle: number,
  pageSpec: string,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  let document: PDFDocument
  try {
    document = await PDFDocument.load(await file.arrayBuffer())
  } catch (error) {
    throw pdfError(error)
  }

  const indices = parsePageSelection(pageSpec, document.getPageCount())
  const pages = document.getPages()
  indices.forEach((index, position) => {
    const page = pages[index]
    const current = page.getRotation().angle
    page.setRotation(degrees((current + angle) % 360))
    onProgress?.(Math.round(((position + 1) / indices.length) * 90))
  })

  const bytes = await document.save({ useObjectStreams: true })
  onProgress?.(100)
  return blobFromBytes(bytes, 'application/pdf')
}

export function pdfPageCountHint(file: File): Promise<number> {
  return loadPdf(file).then(async (pdf) => {
    const count = pdf.numPages
    await pdf.destroy()
    return count
  })
}
