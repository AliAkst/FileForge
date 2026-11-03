import {
  AlignmentType,
  Document,
  FrameAnchorType,
  FrameWrap,
  HeadingLevel,
  HeightRule,
  LineRuleType,
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

interface Segment {
  text: string
  x: number
  width: number
  fontSize: number
}

const POINTS_TO_TWIPS = 20

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
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

/**
 * PDF lines can contain several visually separate runs (for example a job
 * title on the left and its date on the right). Splitting them at large gaps
 * keeps those columns apart instead of collapsing them into one long line.
 */
function segmentsForLine(line: TextLine): Segment[] {
  const spans = [...line.spans].sort((a, b) => a.x - b.x)
  const segments: Segment[] = []
  let current: { text: string; x: number; endX: number; fontSize: number } | null = null

  const flush = () => {
    if (!current) return
    const text = current.text.replace(/\s+/g, ' ').trim()
    if (text) {
      segments.push({
        text,
        x: current.x,
        width: Math.max(1, current.endX - current.x),
        fontSize: current.fontSize,
      })
    }
    current = null
  }

  for (const span of spans) {
    if (!span.str) continue
    if (!current) {
      current = { text: span.str, x: span.x, endX: span.x + span.width, fontSize: span.fontSize }
      continue
    }
    const gap = span.x - current.endX
    const size = Math.min(current.fontSize, span.fontSize)
    if (gap > Math.max(9, size * 0.9)) {
      flush()
      current = { text: span.str, x: span.x, endX: span.x + span.width, fontSize: span.fontSize }
      continue
    }
    const needsSpace =
      gap > Math.max(1.2, size * 0.16) &&
      !current.text.endsWith(' ') &&
      !span.str.startsWith(' ')
    current.text += needsSpace ? ` ${span.str}` : span.str
    current.endX = Math.max(current.endX, span.x + span.width)
    current.fontSize = Math.max(current.fontSize, span.fontSize)
  }

  flush()
  return segments
}

function isShouty(text: string): boolean {
  const letters = text.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '')
  if (letters.length < 4) return false
  const upper = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length
  return upper / letters.length > 0.85
}

/**
 * Places every text segment at its original PDF coordinates using absolutely
 * positioned Word frames. The page keeps the source page size, so the result
 * looks like the PDF while the text stays editable. Photos, vector rules and
 * colors are not recreated by this mode.
 */
function layoutParagraphs(page: PageText, bodySize: number): Paragraph[] {
  const paragraphs: Paragraph[] = []

  for (const line of page.lines) {
    for (const segment of segmentsForLine(line)) {
      const size = clamp(segment.fontSize, 4, 96)
      const baselineFromTop = page.height - line.y
      const top = baselineFromTop - size * 0.8
      const available = Math.max(segment.width + 2, page.width - segment.x - 4)
      const width = Math.min(available, segment.width * 1.22 + 10)
      const bold = size >= bodySize * 1.06 || (isShouty(segment.text) && segment.text.length <= 60)

      paragraphs.push(
        new Paragraph({
          frame: {
            type: 'absolute',
            position: {
              x: Math.round(Math.max(0, segment.x) * POINTS_TO_TWIPS),
              y: Math.round(Math.max(0, top) * POINTS_TO_TWIPS),
            },
            width: Math.round(width * POINTS_TO_TWIPS),
            height: Math.round(size * 1.4 * POINTS_TO_TWIPS),
            anchor: {
              horizontal: FrameAnchorType.PAGE,
              vertical: FrameAnchorType.PAGE,
            },
            wrap: FrameWrap.NONE,
            rule: HeightRule.ATLEAST,
          },
          spacing: { before: 0, after: 0, line: Math.round(size * 1.2 * POINTS_TO_TWIPS), lineRule: LineRuleType.AT_LEAST },
          children: [
            new TextRun({
              text: segment.text,
              size: Math.round(size * 2),
              bold,
              font: 'Arial',
              color: '111111',
            }),
          ],
        }),
      )
    }
  }

  return paragraphs
}

export interface PdfToDocxOptions {
  pageSpec?: string
  detectHeadings?: boolean
  preserveLayout?: boolean
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
  const preserveLayout = options.preserveLayout ?? true
  const children: Paragraph[] = []
  const firstPage = pages[0]
  const horizontalTwips = Math.round(firstPage.width * POINTS_TO_TWIPS)
  const verticalTwips = Math.round(firstPage.height * POINTS_TO_TWIPS)

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new PageBreak()],
        }),
      )
    }

    if (preserveLayout) {
      children.push(...layoutParagraphs(page, bodySize))
    } else {
      const blocks = blocksForPage(page, bodySize, options.detectHeadings ?? true)
      blocks.forEach((block) => {
        children.push(paragraphForBlock(block, bodySize))
      })
    }
    options.onProgress?.(72 + Math.round(((pageIndex + 1) / pages.length) * 22))
  })

  const document = new Document({
    creator: 'FileForge',
    title: baseName(file.name),
    description: 'Converted locally with FileForge',
    styles: {
      default: {
        document: {
          run: { font: preserveLayout ? 'Arial' : 'Calibri', size: 22, color: '1C1917' },
          paragraph: { spacing: preserveLayout ? { before: 0, after: 0, line: 240 } : { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: preserveLayout ? { width: horizontalTwips, height: verticalTwips } : undefined,
            margin: preserveLayout
              ? { top: 0, right: 0, bottom: 0, left: 0 }
              : { top: 1134, right: 1134, bottom: 1134, left: 1134 },
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
