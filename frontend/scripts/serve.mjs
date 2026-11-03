import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
}

/**
 * Minimal static server for the production build. It only listens on
 * localhost and never forwards anything; every file is served straight from
 * the local `dist` folder.
 */
export async function startServer({ root, port }) {
  const base = resolve(root)

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      if (url.pathname === '/__fileforge') {
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        response.end('{"app":"fileforge"}')
        return
      }
      let pathname = decodeURIComponent(url.pathname)
      if (pathname === '/') pathname = '/index.html'

      let filePath = normalize(join(base, pathname))
      if (filePath !== base && !filePath.startsWith(base + sep)) {
        response.writeHead(403).end('Forbidden')
        return
      }

      let info = await stat(filePath).catch(() => null)
      if (!info || !info.isFile()) {
        filePath = join(base, 'index.html')
        info = await stat(filePath).catch(() => null)
      }
      if (!info) {
        response.writeHead(404).end('Not found')
        return
      }

      const data = await readFile(filePath)
      response.writeHead(200, {
        'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': 'no-cache',
      })
      response.end(data)
    } catch {
      response.writeHead(500).end('Server error')
    }
  })

  await new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolvePromise)
  })

  return server
}

export function serverPort(server) {
  const address = server.address()
  return typeof address === 'object' && address ? address.port : 0
}
