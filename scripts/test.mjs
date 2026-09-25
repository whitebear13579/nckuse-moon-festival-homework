import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'

const root = process.cwd()
const tmp = await mkdtemp(join(tmpdir(), 'moon-festival-test-'))
const projectId = `moon-test-${randomUUID().slice(0, 8)}`
const portBase = 56000 + Math.floor(Math.random() * 30) * 100
const appPort = portBase + 80
const origin = `http://127.0.0.1:${appPort}`
const supabaseCli = join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
const nextCli = join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const vitestCli = join(root, 'node_modules', 'vitest', 'vitest.mjs')
const playwrightCli = join(root, 'node_modules', '@playwright', 'test', 'cli.js')
let appServer
let stackStarted = false

function run(args, env = process.env, timeoutMs = 180_000) {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true })
    let output = ''
    const timer = setTimeout(() => { child.kill(); fail(new Error(`Timed out: ${args[0]}`)) }, timeoutMs)
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('error', fail)
    child.on('close', code => {
      clearTimeout(timer)
      if (code === 0) done(output)
      else fail(new Error(`${basename(args[0])} exited ${code}; inspect local Docker/Supabase logs`))
    })
  })
}

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(`${origin}/api/leaderboard?stage=1`, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return
    } catch { /* The server is still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error('Test Next.js server did not become ready')
}

try {
  const config = (await readFile(join(root, 'supabase', 'config.toml'), 'utf8'))
    .replace(/project_id = "[^"]+"/, `project_id = "${projectId}"`)
    .replace(/\b543(\d{2})\b/g, (_, suffix) => String(portBase + Number(suffix)))
  await mkdir(join(tmp, 'supabase'), { recursive: true })
  await writeFile(join(tmp, 'supabase', 'config.toml'), config)
  await writeFile(join(tmp, 'supabase', 'seed.sql'), '')
  await cp(join(root, 'supabase', 'migrations'), join(tmp, 'supabase', 'migrations'), { recursive: true })
  await cp(join(root, 'supabase', 'tests'), join(tmp, 'supabase', 'tests'), { recursive: true })
  console.log('Starting isolated local Supabase test stack…')
  await run([supabaseCli, '--workdir', tmp, 'start'], process.env, 300_000)
  stackStarted = true
  const statusOutput = await run([supabaseCli, '--workdir', tmp, 'status', '-o', 'json'])
  const status = JSON.parse(statusOutput.slice(statusOutput.indexOf('{')))
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    APP_ORIGIN: origin,
    PLAYWRIGHT_BASE_URL: origin,
    PLAYWRIGHT_EXTERNAL_SERVER: '1',
  }
  console.log('Running database and unit tests…')
  await run([supabaseCli, '--workdir', tmp, 'test', 'db'], env)
  await run([vitestCli, 'run'], env)
  console.log('Building Next.js and running browser/API integration tests…')
  await run([nextCli, 'build'], env, 180_000)
  appServer = spawn(process.execPath, [nextCli, 'start', '-p', String(appPort), '-H', '127.0.0.1'], {
    cwd: root, env, windowsHide: true, stdio: 'ignore',
  })
  await waitForServer()
  await run([playwrightCli, 'test', '--reporter=line'], env, 300_000)
  console.log('Database, unit, API and browser tests passed.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  if (appServer) appServer.kill()
  if (stackStarted) {
    try { await run([supabaseCli, '--workdir', tmp, 'stop'], process.env, 120_000) }
    catch { console.error('Test Supabase stack cleanup failed; inspect Docker containers.') }
  }
  const safe = resolve(tmp).startsWith(resolve(tmpdir()) + sep) && basename(tmp).startsWith('moon-festival-test-')
  if (safe) await rm(tmp, { recursive: true, force: true })
}
