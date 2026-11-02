import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx'
import { AppError } from './errors'
import { baseName, tick } from './files'
import { extractPdfPages, type PageText, type TextLine } from './pdf'

interface Block {
  text: string
  fontSize: number
  heading: 1 | 2 | 3 | null
  bullet: boolean
}

function weightedMedianSize(pages: PageText[]): number {
  const entries: { size: number; weight: number }[] = []
  for (const page of pages) {
    for (const line of page.lines) {
      entries.push({ size: line.fontSize, weight: Math.max(1, line.text.length) })
    }
  }
  if (entries.length === 0) return 11
  entries.sort((a, b) => a.size - b.size)
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let running = 0
  for (const entry of entries) {
    running += entry.weight
    if (running >= total / 2) return entry.size
  }
  return entries[entries.length - 1].size
}

function headingLevel(line: TextLine, bodySize: number, detectHeadings: boolean): 1 | 2 | 3 | null {
  if (!detectHeadings) return null
  const ratio = line.fontSize / bodySize
  const shortEnough = line.text.length <= 140
  if (!shortEnough) return null
  if (ratio >= 1.85) return 1
  if (ratio >= 1.45) return 2
  if (ratio >= 1.18) return 3
  return null
}

function isBullet(text: string): boolean {
  return /^[•●▪◦‣·]\s+/.test(text) || /^[-–—]\s+/.test(text)
}

function blocksForPage(page: PageText, bodySize: number, detectHeadings: boolean): Block[] {
  const blocks: Block[] = []
  let current: Block | null = null
  let previous: TextLine | null = null

  for (const line of page.lines) {
    const heading = headingLevel(line, bodySize, detectHeadings)
    const bullet = isBullet(line.text)

    if (heading) {
      if (current) {
        blocks.push(current)
        current = null
      }
      blocks.push({
        text: line.text,
        fontSize: line.fontSize,
        heading,
        bullet: false,
      })
      previous = line
      continue
    }

    if (!current) {
      current = {
        text: line.text,
        fontSize: line.fontSize,
        heading: null,
        bullet,
      }
      previous = line
      continue
    }

    const gap = previous ? previous.y - line.y : 0
    const size = Math.max(current.fontSize, line.fontSize)
    const indentShift = Math.abs(line.x - (previous?.x ?? line.x))
    const sentenceEnded = /[.!?;:]$/.test(current.text)
    const startsNewBlock =
      gap > size * 1.55 ||
      gap < -1 ||
      bullet ||
      indentShift > Math.max(14, line.fontSize * 1.4) ||
      (sentenceEnded && indentShift > 6)

    if (startsNewBlock) {
      blocks.push(current)
      current = {
        text: line.text,
        fontSize: line.fontSize,
        heading: null,
        bullet,
      }
    } else {
      const joinWithoutSpace = /[-–]$/.test(current.text)
      if (joinWithoutSpace) {
        current.text = `${current.text.slice(0, -1)}${line.text}`
      } else {
        current.text = `${current.text} ${line.text}`
      }
      current.fontSize = Math.max(current.fontSize, line.fontSize)
    }
    previous = line
  }

  if (current) blocks.push(current)
  return blocks
}

function paragraphForBlock(block: Block, bodySize: number): Paragraph {
  const halfPoints = Math.min(48, Math.max(16, Math.round(block.fontSize * 2)))

  if (block.heading) {
    const level =
      block.heading === 1
        ? HeadingLevel.HEADING_1
        : block.heading === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3
    return new Paragraph({
      heading: level,
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({
          text: block.text,
          bold: true,
          size: block.heading === 1 ? 36 : block.heading === 2 ? 30 : 26,
          font: 'Calibri',
        }),
      ],
    })
  }

  const bulletText = block.bullet ? block.text.replace(/^[•●▪◦‣·]\s+/, '').replace(/^[-–—]\s+/, '') : null
  const isNumeric = /^\d+[.)]\s+/.test(block.text)

  return new Paragraph({
    ...(bulletText ? { bullet: { level: 0 } } : {}),
    ...(isNumeric ? { indent: { left: 360, hanging: 240 } } : {}),
    alignment: AlignmentType.LEFT,
    spacing: { after: Math.max(60, Math.round(bodySize * 6)), line: 300 },
    children: [
      new TextRun({
        text: bulletText ?? block.text,
        size: halfPoints,
        font: 'Calibri',
      }),
    ],
  })
}

export interface PdfToDocxOptions {
  pageSpec?: string
  detectHeadings?: boolean
  onProgress?: (percent: number) => void
}

export async function pdfToDocx(file: File, options: PdfToDocxOptions = {}): Promise<Blob> {
  const pages = await extractPdfPages(file, options.pageSpec ?? '', (percent) =>
    options.onProgress?.(Math.round(percent * 0.72)),
  )

  if (pages.every((page) => page.lines.length === 0)) {
    throw new AppError('noText')
  }

  const bodySize = weightedMedianSize(pages)
  const children: Paragraph[] = []

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }
    const blocks = blocksForPage(page, bodySize, options.detectHeadings ?? true)
    blocks.forEach((block) => {
      children.push(paragraphForBlock(block, bodySize))
    })
    options.onProgress?.(72 + Math.round(((pageIndex + 1) / pages.length) * 22))
  })

  const document = new Document({
    creator: 'FileForge',
    title: baseName(file.name),
    description: 'Converted locally with FileForge',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '1C1917' },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  })

  await tick()
  const blob = await Packer.toBlob(document)
  options.onProgress?.(100)
  return blob
}
