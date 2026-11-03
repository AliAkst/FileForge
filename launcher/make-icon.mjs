import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SIZE = 256
const SCALE = 4
const BIG = SIZE * SCALE
const U = BIG / 64

const pixels = new Uint8ClampedArray(BIG * BIG * 4)

function fillRect(left, top, right, bottom, color, radius = 0) {
  const [r, g, b, a] = color
  for (let y = Math.max(0, Math.floor(top)); y < Math.min(BIG, Math.ceil(bottom)); y += 1) {
    for (let x = Math.max(0, Math.floor(left)); x < Math.min(BIG, Math.ceil(right)); x += 1) {
      const nearX = x < left + radius ? left + radius - x : x > right - radius ? x - (right - radius) : 0
      const nearY = y < top + radius ? top + radius - y : y > bottom - radius ? y - (bottom - radius) : 0
      if (nearX > 0 && nearY > 0 && nearX * nearX + nearY * nearY > radius * radius) continue
      const index = (y * BIG + x) * 4
      const alpha = a / 255
      pixels[index] = pixels[index] * (1 - alpha) + r * alpha
      pixels[index + 1] = pixels[index + 1] * (1 - alpha) + g * alpha
      pixels[index + 2] = pixels[index + 2] * (1 - alpha) + b * alpha
      pixels[index + 3] = Math.max(pixels[index + 3], a)
    }
  }
}

function fillTriangle(ax, ay, bx, by, cx, cy, color) {
  const [r, g, b, a] = color
  const minX = Math.floor(Math.min(ax, bx, cx))
  const maxX = Math.ceil(Math.max(ax, bx, cx))
  const minY = Math.floor(Math.min(ay, by, cy))
  const maxY = Math.ceil(Math.max(ay, by, cy))
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry)
  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const d1 = sign(x, y, ax, ay, bx, by)
      const d2 = sign(x, y, bx, by, cx, cy)
      const d3 = sign(x, y, cx, cy, ax, ay)
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0
      if (hasNeg && hasPos) continue
      const index = (y * BIG + x) * 4
      const alpha = a / 255
      pixels[index] = pixels[index] * (1 - alpha) + r * alpha
      pixels[index + 1] = pixels[index + 1] * (1 - alpha) + g * alpha
      pixels[index + 2] = pixels[index + 2] * (1 - alpha) + b * alpha
      pixels[index + 3] = Math.max(pixels[index + 3], a)
    }
  }
}

// Orange gradient rounded square, matching the app favicon.
for (let y = 0; y < BIG; y += 1) {
  const t = y / BIG
  const r = Math.round(251 + (234 - 251) * t)
  const g = Math.round(146 + (88 - 146) * t)
  const b = Math.round(60 + (12 - 60) * t)
  for (let x = 0; x < BIG; x += 1) {
    const index = (y * BIG + x) * 4
    pixels[index] = r
    pixels[index + 1] = g
    pixels[index + 2] = b
    pixels[index + 3] = 0
  }
}

const radius = 16 * U
for (let y = 0; y < BIG; y += 1) {
  for (let x = 0; x < BIG; x += 1) {
    const nearX = x < radius ? radius - x : x > BIG - radius ? x - (BIG - radius) : 0
    const nearY = y < radius ? radius - y : y > BIG - radius ? y - (BIG - radius) : 0
    const index = (y * BIG + x) * 4
    pixels[index + 3] = nearX > 0 && nearY > 0 && nearX * nearX + nearY * nearY > radius * radius ? 0 : 255
  }
}

// White document with a folded top-right corner.
fillRect(21 * U, 16 * U, 45 * U, 52 * U, [255, 255, 255, 246], 4 * U)
fillTriangle(36 * U, 16 * U, 45 * U, 25 * U, 36 * U, 25 * U, [254, 215, 170, 255])
fillTriangle(36 * U, 16 * U, 45 * U, 25 * U, 45 * U, 16 * U, [251, 146, 60, 255])

// Document lines.
fillRect(24 * U, 33 * U, 38 * U, 35.6 * U, [234, 88, 12, 255], 1.3 * U)
fillRect(24 * U, 39 * U, 38 * U, 41.6 * U, [234, 88, 12, 255], 1.3 * U)
fillRect(24 * U, 45 * U, 32 * U, 47.6 * U, [234, 88, 12, 255], 1.3 * U)

// Downsample with a box filter for smooth edges.
const out = new Uint8Array(SIZE * SIZE * 4)
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    let r = 0
    let g = 0
    let b = 0
    let a = 0
    for (let dy = 0; dy < SCALE; dy += 1) {
      for (let dx = 0; dx < SCALE; dx += 1) {
        const index = ((y * SCALE + dy) * BIG + (x * SCALE + dx)) * 4
        const alpha = pixels[index + 3] / 255
        r += pixels[index] * alpha
        g += pixels[index + 1] * alpha
        b += pixels[index + 2] * alpha
        a += alpha
      }
    }
    const outIndex = (y * SIZE + x) * 4
    if (a === 0) {
      out[outIndex] = 0
      out[outIndex + 1] = 0
      out[outIndex + 2] = 0
      out[outIndex + 3] = 0
    } else {
      out[outIndex] = Math.round(r / a)
      out[outIndex + 1] = Math.round(g / a)
      out[outIndex + 2] = Math.round(b / a)
      out[outIndex + 3] = Math.round((a / (SCALE * SCALE)) * 255)
    }
  }
}

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y += 1) {
  raw[y * (SIZE * 4 + 1)] = 0
  Buffer.from(out.buffer, out.byteOffset + y * SIZE * 4, SIZE * 4).copy(raw, y * (SIZE * 4 + 1) + 1)
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8
ihdr[9] = 6

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)

const entry = Buffer.alloc(16)
entry[0] = 0
entry[1] = 0
entry[2] = 0
entry[3] = 0
entry.writeUInt16LE(1, 4)
entry.writeUInt16LE(32, 6)
entry.writeUInt32LE(png.length, 8)
entry.writeUInt32LE(22, 12)

await mkdir(here, { recursive: true })
await writeFile(join(here, 'fileforge.ico'), Buffer.concat([header, entry, png]))
await writeFile(join(here, 'fileforge.png'), png)
console.log('wrote launcher/fileforge.ico')
