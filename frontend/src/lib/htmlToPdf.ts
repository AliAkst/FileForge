import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export interface HtmlPdfOptions {
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
  title?: string
  onProgress?: (percent: number) => void
}

export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  parsed.querySelectorAll('script, iframe, object, embed, link, meta, base, form').forEach((element) => {
    element.remove()
  })
  parsed.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name.startsWith('on')) element.removeAttribute(attribute.name)
      if ((name === 'href' || name === 'src') && /^javascript:/i.test(value)) {
        element.removeAttribute(attribute.name)
      }
    }
  })
  return parsed.body.innerHTML
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve()
            return
          }
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  ).then(() => undefined)
}

const DOCUMENT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .ff-document {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1c1917;
    font-size: 11.5pt;
    line-height: 1.65;
    overflow-wrap: break-word;
  }
  .ff-document h1, .ff-document h2, .ff-document h3, .ff-document h4 {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #0c0a09;
    line-height: 1.25;
    margin: 1.3em 0 0.45em;
  }
  .ff-document h1 { font-size: 2em; }
  .ff-document h2 { font-size: 1.5em; }
  .ff-document h3 { font-size: 1.2em; }
  .ff-document p { margin: 0 0 0.85em; }
  .ff-document ul, .ff-document ol { margin: 0 0 0.9em 1.4em; padding: 0; }
  .ff-document li { margin-bottom: 0.25em; }
  .ff-document table { width: 100%; border-collapse: collapse; margin: 0.8em 0 1.1em; font-size: 9.5pt; }
  .ff-document th, .ff-document td { border: 1px solid #d6d3d1; padding: 6px 8px; text-align: left; vertical-align: top; }
  .ff-document th { background: #f5f5f4; font-weight: 700; }
  .ff-document img { max-width: 100%; height: auto; }
  .ff-document blockquote { margin: 0.8em 0; padding-left: 1em; border-left: 3px solid #fdba74; color: #57534e; }
  .ff-document pre { white-space: pre-wrap; font-family: Consolas, monospace; font-size: 9.5pt; background: #f5f5f4; padding: 10px; border-radius: 6px; }
  .ff-document a { color: #c2410c; text-decoration: underline; }
`

export async function htmlToPdf(html: string, options: HtmlPdfOptions = {}): Promise<Blob> {
  const orientation = options.orientation ?? 'portrait'
  const format = options.format ?? 'a4'
  const contentWidth = format === 'letter' ? 816 : 794
  const renderWidth = orientation === 'landscape' ? Math.round(contentWidth * 1.414) : contentWidth

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = [
    'position: fixed',
    'left: -10000px',
    'top: 0',
    `width: ${renderWidth}px`,
    'padding: 48px',
    'background: #ffffff',
    'color: #1c1917',
    'z-index: -1',
    'pointer-events: none',
  ].join(';')

  const style = document.createElement('style')
  style.textContent = DOCUMENT_CSS
  host.appendChild(style)

  const content = document.createElement('div')
  content.className = 'ff-document'
  content.innerHTML = sanitizeHtml(html)
  host.appendChild(content)
  document.body.appendChild(host)

  try {
    await waitForImages(content)
    if (document.fonts?.ready) await document.fonts.ready
    options.onProgress?.(18)

    const canvas = await html2canvas(host, {
      scale: 1.6,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: renderWidth,
      windowWidth: renderWidth,
    })
    options.onProgress?.(72)

    const pdf = new jsPDF({
      unit: 'mm',
      format,
      orientation,
      compress: true,
    })
    if (options.title) pdf.setProperties({ title: options.title })

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Empty canvas')
    }

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const usableWidth = pageWidth - margin * 2
    const usableHeight = pageHeight - margin * 2
    const sliceHeight = Math.max(1, Math.floor((canvas.width * usableHeight) / usableWidth))

    let offset = 0
    let pageIndex = 0
    while (offset < canvas.height) {
      const slicePixelHeight = Math.min(sliceHeight, canvas.height - offset)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = slicePixelHeight

      const context = pageCanvas.getContext('2d')
      if (!context) throw new Error('Canvas context unavailable')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      context.drawImage(
        canvas,
        0,
        offset,
        canvas.width,
        slicePixelHeight,
        0,
        0,
        canvas.width,
        slicePixelHeight,
      )

      if (pageIndex > 0) pdf.addPage(format, orientation)
      const imageData = pageCanvas.toDataURL('image/jpeg', 0.94)
      const renderedHeight = (slicePixelHeight * usableWidth) / canvas.width
      pdf.addImage(imageData, 'JPEG', margin, margin, usableWidth, renderedHeight, undefined, 'FAST')

      offset += slicePixelHeight
      pageIndex += 1
      options.onProgress?.(72 + Math.round((offset / canvas.height) * 24))
    }

    return pdf.output('blob')
  } finally {
    host.remove()
  }
}
