import JSZip from 'jszip'
import { AppError } from './errors'

export const MAX_FILE_SIZE = 100 * 1024 * 1024

export interface OutputFile {
  name: string
  blob: Blob
  note?: string
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`
}

export function extensionOf(name: string): string {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

export function baseName(name: string): string {
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(0, index) : name
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 120) || 'file'
}

export function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const base = baseName(name)
  const ext = extensionOf(name)
  let index = 2
  let candidate = ext ? `${base}-${index}.${ext}` : `${base}-${index}`
  while (used.has(candidate)) {
    index += 1
    candidate = ext ? `${base}-${index}.${ext}` : `${base}-${index}`
  }
  used.add(candidate)
  return candidate
}

export function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export function readAsText(file: File): Promise<string> {
  return file.text()
}

export function blobFromBytes(bytes: Uint8Array, type: string): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer], { type })
}

interface SaveFilePicker {
  (options?: { suggestedName?: string }): Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>
      close: () => Promise<void>
    }>
  }>
}

export type SaveResult = 'saved' | 'download' | 'cancelled'

/**
 * Saves a blob using the File System Access API when the browser supports it,
 * so the user explicitly picks a destination. Older browsers (and embedded
 * webviews) fall back to a regular anchor download.
 */
export async function saveBlob(blob: Blob, name: string): Promise<SaveResult> {
  const filename = sanitizeFilename(name)
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker

  if (typeof picker === 'function') {
    try {
      const handle = await picker.call(window, { suggestedName: filename })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
      // Not allowed or not available here: use the standard download path.
    }
  }

  downloadBlob(blob, filename)
  return 'download'
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = sanitizeFilename(name)
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  // Some webviews cancel the download when the anchor is removed in the same
  // tick, so keep it around briefly. Keep the object URL alive long enough for
  // large files to start/finish downloading.
  window.setTimeout(() => anchor.remove(), 1_000)
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function zipOutputs(files: OutputFile[], zipName: string): Promise<OutputFile> {
  const zip = new JSZip()
  const used = new Set<string>()
  files.forEach((file) => {
    zip.file(uniqueName(file.name, used), file.blob)
  })
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return { name: zipName, blob }
}

export function tick(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0))
}

export function assertReadable(file: File) {
  if (file.size === 0) throw new AppError('emptyFile')
  if (file.size > MAX_FILE_SIZE) throw new AppError('fileTooLarge')
}

/**
 * Parses page specs such as "1-3,5,8-" into groups of zero-based page indexes.
 * Every comma-separated token becomes its own group, which is exactly what
 * the split tool needs. For selection tools, flatten the result.
 */
export function parsePageGroups(spec: string, totalPages: number): number[][] {
  const cleaned = spec.trim()
  if (!cleaned) {
    return [Array.from({ length: totalPages }, (_, index) => index)]
  }

  const groups: number[][] = []
  const seen = new Set<number>()

  for (const rawToken of cleaned.split(/[,;]/)) {
    const token = rawToken.trim()
    if (!token) continue

    let start = 0
    let end = 0
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d*)$/)
    const singleMatch = token.match(/^(\d+)$/)

    if (rangeMatch) {
      start = Number(rangeMatch[1])
      end = rangeMatch[2] ? Number(rangeMatch[2]) : totalPages
    } else if (singleMatch) {
      start = Number(singleMatch[1])
      end = start
    } else {
      continue
    }

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    start = Math.max(1, Math.min(start, totalPages))
    end = Math.max(1, Math.min(end, totalPages))
    if (end < start) [start, end] = [end, start]

    const group: number[] = []
    for (let page = start; page <= end; page += 1) {
      const index = page - 1
      if (!seen.has(index)) {
        seen.add(index)
        group.push(index)
      }
    }
    if (group.length > 0) groups.push(group)
  }

  return groups.length > 0 ? groups : [Array.from({ length: totalPages }, (_, index) => index)]
}

export function parsePageSelection(spec: string, totalPages: number): number[] {
  return parsePageGroups(spec, totalPages).flat()
}

export function outputName(inputName: string, suffix: string, extension: string): string {
  return `${sanitizeFilename(baseName(inputName))}${suffix}.${extension}`
}
