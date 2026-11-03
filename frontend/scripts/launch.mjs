import { spawn, spawnSync } from 'node:child_process'
import { appendFile, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startServer, serverPort } from './serve.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const frontendDir = dirname(here)
const distDir = join(frontendDir, 'dist')
const stateDir = join(process.env.LOCALAPPDATA ?? tmpdir(), 'FileForge')
const stateFile = join(stateDir, 'app.json')
const logFile = join(stateDir, 'launcher.log')
const profileDir = join(stateDir, 'browser')
const FIRST_PORT = 4317
const LAST_PORT = 4340

async function log(message) {
  try {
    await mkdir(stateDir, { recursive: true })
    await appendFile(logFile, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    // Logging must never break the launcher.
  }
}

async function newestMtime(directory) {
  let newest = 0
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      newest = Math.max(newest, await newestMtime(path))
    } else {
      const info = await stat(path).catch(() => null)
      if (info) newest = Math.max(newest, info.mtimeMs)
    }
  }
  return newest
}

async function ensureBuild() {
  const indexFile = join(distDir, 'index.html')
  const distInfo = await stat(indexFile).catch(() => null)
  if (!distInfo) {
    await build()
    return
  }
  const sourceTime = await newestMtime(join(frontendDir, 'src'))
  const configTime = Math.max(
    await stat(join(frontendDir, 'index.html')).then((s) => s.mtimeMs).catch(() => 0),
    await stat(join(frontendDir, 'vite.config.ts')).then((s) => s.mtimeMs).catch(() => 0),
  )
  if (Math.max(sourceTime, configTime) > distInfo.mtimeMs) {
    await build()
  }
}

async function build() {
  const vite = join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) {
    await log('vite is not installed; run npm install in frontend')
    process.exit(1)
  }
  await log('building production bundle')
  const result = spawnSync(process.execPath, [vite, 'build'], {
    cwd: frontendDir,
    stdio: 'ignore',
  })
  if (result.status !== 0) {
    await log(`build failed with status ${result.status}`)
    process.exit(1)
  }
}

function findBrowser() {
  const candidates = [
    join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    join(process.env.ProgramFiles ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]
  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? null
}

function openAppWindow(browser, url) {
  return spawn(
    browser,
    [
      `--app=${url}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=Translate,MediaRouter',
      '--window-size=1360,940',
    ],
    { stdio: 'ignore' },
  )
}

async function runningApp() {
  try {
    const state = JSON.parse(await readFile(stateFile, 'utf8'))
    if (!state?.url) return null
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 900)
    const response = await fetch(`${state.url}__fileforge`, { signal: controller.signal })
    clearTimeout(timer)
    if (!response.ok) return null
    const data = await response.json()
    return data?.app === 'fileforge' ? state.url : null
  } catch {
    return null
  }
}

async function startOnFreePort() {
  for (let port = FIRST_PORT; port <= LAST_PORT; port += 1) {
    let server
    try {
      server = await startServer({ root: distDir, port })
    } catch {
      continue
    }
    const url = `http://127.0.0.1:${serverPort(server)}/`
    await mkdir(stateDir, { recursive: true })
    await writeFile(stateFile, JSON.stringify({ url, pid: process.pid }), 'utf8')
    await log(`server started at ${url}`)
    return { server, url }
  }
  throw new Error('No free port for the local server')
}

async function shutdown(server) {
  await unlink(stateFile).catch(() => {})
  await new Promise((resolve) => server.close(resolve))
}

async function main() {
  if (!existsSync(join(frontendDir, 'package.json'))) {
    await log('frontend folder not found')
    process.exit(1)
  }

  const browser = findBrowser()
  if (!browser) {
    await log('Chrome or Edge was not found')
    process.exit(1)
  }

  const existing = await runningApp()
  if (existing) {
    await log(`reusing running app at ${existing}`)
    openAppWindow(browser, existing)
    // The existing server keeps running; this instance only opened a window.
    setTimeout(() => process.exit(0), 2500)
    return
  }

  await ensureBuild()
  const { server, url } = await startOnFreePort()
  const child = openAppWindow(browser, url)
  const stop = () => {
    child.kill()
    void shutdown(server)
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  child.on('exit', async () => {
    await log('app window closed')
    await shutdown(server)
    process.exit(0)
  })
  child.on('error', async (error) => {
    await log(`browser failed: ${error.message}`)
    await shutdown(server)
    process.exit(1)
  })
}

main().catch(async (error) => {
  await log(`launcher failed: ${error instanceof Error ? error.stack : String(error)}`)
  process.exit(1)
})

// Keep the event loop alive while the browser window is open.
setInterval(() => {}, 1 << 30)
