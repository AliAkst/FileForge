import mammoth from 'mammoth'
import { AppError } from './errors'
import { htmlToPdf } from './htmlToPdf'

export interface DocxToPdfOptions {
  orientation?: 'portrait' | 'landscape'
  onProgress?: (percent: number) => void
}

export async function docxToPdf(file: File, options: DocxToPdfOptions = {}): Promise<Blob> {
  options.onProgress?.(5)

  let html: string
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => p.subtitle:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
        ],
      },
    )
    html = result.value
  } catch {
    throw new AppError('docxLoad')
  }

  if (!html.replace(/<[^>]*>/g, '').trim() && !/<img/i.test(html)) {
    throw new AppError('docxLoad')
  }

  options.onProgress?.(12)

  return htmlToPdf(html, {
    orientation: options.orientation ?? 'portrait',
    format: 'a4',
    title: file.name,
    onProgress: (percent) => options.onProgress?.(Math.min(99, 12 + Math.round(percent * 0.87))),
  })
}
