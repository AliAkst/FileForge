import regularFontUrl from '../assets/fonts/NotoSans-Regular.ttf?url'
import boldFontUrl from '../assets/fonts/NotoSans-Bold.ttf?url'

export interface FontData {
  regular: ArrayBuffer
  bold: ArrayBuffer
}

let cache: Promise<FontData> | null = null

export function loadFonts(): Promise<FontData> {
  if (!cache) {
    cache = Promise.all([
      fetch(regularFontUrl).then((response) => response.arrayBuffer()),
      fetch(boldFontUrl).then((response) => response.arrayBuffer()),
    ]).then(([regular, bold]) => ({ regular, bold }))
  }
  return cache
}
