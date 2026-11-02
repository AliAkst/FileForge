import { PDFDocument } from 'pdf-lib'
import { AppError } from './errors'
import { blobFromBytes, tick } from './files'

export interface ImagesToPdfOptions {
  pageSize?: 'auto' | 'a4' | 'letter'
  orientation?: 'auto' | 'portrait' | 'landscape'
  margin?: 'none' | 'small' | 'normal'
  onProgress?: (percent: number) => void
}

interface NormalizedImage {
  bytes: Uint8Array
  kind: 'jpg' | 'png'
  width: number
  height: number
}

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
}

const MARGINS = {
  none: 0,
  small: 18,
  normal: 36,
}

async function normalizeImage(file: File): Promise<NormalizedImage> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (extension === 'jpg' || extension === 'jpeg' || file.type === 'image/jpeg') {
    return { bytes, kind: 'jpg', width: 0, height: 0 }
  }

  if (extension === 'png' || file.type === 'image/png') {
    return { bytes, kind: 'png', width: 0, height: 0 }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AppError('imageLoad')
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new AppError('imageLoad')
  }
  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!pngBlob) throw new AppError('imageLoad')

  return {
    bytes: new Uint8Array(await pngBlob.arrayBuffer()),
    kind: 'png',
    width: canvas.width,
    height: canvas.height,
  }
}

export async function imagesToPdf(files: File[], options: ImagesToPdfOptions = {}): Promise<Blob> {
  const document = await PDFDocument.create()
  document.setProducer('FileForge')
  document.setCreator('FileForge — local image to PDF')
  const pageSize = options.pageSize ?? 'a4'
  const orientationOption = options.orientation ?? 'auto'
  const margin = MARGINS[options.margin ?? 'small']

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const normalized = await normalizeImage(file)

    let image
    try {
      image = normalized.kind === 'jpg'
        ? await document.embedJpg(normalized.bytes)
        : await document.embedPng(normalized.bytes)
    } catch {
      throw new AppError('imageLoad')
    }

    const imageWidth = image.width
    const imageHeight = image.height

    let pageWidth: number
    let pageHeight: number

    if (pageSize === 'auto') {
      const maxWidth = 841.89
      const maxHeight = 1190.55
      const scale = Math.min(1, maxWidth / imageWidth, maxHeight / imageHeight)
      pageWidth = imageWidth * scale
      pageHeight = imageHeight * scale
      const page = document.addPage([pageWidth, pageHeight])
      page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight })
    } else {
      const base = PAGE_SIZES[pageSize]
      const orientation =
        orientationOption === 'auto'
          ? imageWidth > imageHeight
            ? 'landscape'
            : 'portrait'
          : orientationOption
      pageWidth = orientation === 'landscape' ? base.height : base.width
      pageHeight = orientation === 'landscape' ? base.width : base.height

      const page = document.addPage([pageWidth, pageHeight])
      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2
      const scale = Math.min(contentWidth / imageWidth, contentHeight / imageHeight)
      const drawWidth = imageWidth * scale
      const drawHeight = imageHeight * scale
      page.drawImage(image, {
        x: (pageWidth - drawWidth) / 2,
        y: (pageHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      })
    }

    options.onProgress?.(Math.round(((index + 1) / files.length) * 96))
    await tick()
  }

  const bytes = await document.save({ useObjectStreams: true })
  options.onProgress?.(100)
  return blobFromBytes(bytes, 'application/pdf')
}
