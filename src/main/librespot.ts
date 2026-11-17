import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createServer } from 'node:net'
import { app, shell } from 'electron'
import WebSocket from 'ws'
import type { LibrespotStatus } from '../shared/types'

const API_PORT = 3678
// go-librespot's logger (logrus) wraps the whole message in double quotes
// when it contains spaces, so a naive \S+ capture swallows that trailing
// quote as part of the URL — corrupting the last query param (scope) and
// making Spotify reject the request before ever showing a login screen.
const AUTH_LINK_REGEX = /to complete authentication visit the following link: ([^\s"]+)/
const MAX_START_ATTEMPTS = 6

// A stale browser tab from a previous run (pending navigation, extension
// retry, etc.) can end up hitting a reused fixed port with no `code` query
// param, which go-librespot treats as a fatal auth error. Picking a fresh
// free port on every start makes that class of collision impossible.
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address()
      if (address && typeof address === 'object') {
        const port = address.port
        srv.close(() => resolve(port))
      } else {
        srv.close(() => reject(new Error('could not determine a free port')))
      }
    })
  })
}

function resolveBinaryPath(): string {
  const target = `${process.platform}-${process.arch}`
  const binName = process.platform === 'win32' ? 'go-librespot.exe' : 'go-librespot'
  const base = app.isPackaged
    ? path.join(process.resourcesPath, 'bin', target)
    : path.join(__dirname, '..', '..', 'resources', 'bin', target)
  return path.join(base, binName)
}

function audioBackendFor(platform: NodeJS.Platform): string {
  if (platform === 'win32') return 'wasapi'
  return 'pulseaudio'
}

// Uses the "interactive" credentials flow (browser OAuth with go-librespot's
// own client id) rather than zeroconf: zeroconf needs the phone and PC on a
// shared LAN with working mDNS, which breaks on USB tethering, Public
// network profiles, VPNs, etc. Credentials are cached in state.json after
// the first login.
function buildConfigYaml(configDir: string, authCallbackPort: number): string {
  const cacheDir = path.join(configDir, 'cache').replace(/\\/g, '/')
  return `device_name: Cozy Player
device_type: computer
audio_backend: ${audioBackendFor(process.platform)}
volume_steps: 100
initial_volume: 70
zeroconf_enabled: false
credentials:
  type: interactive
  interactive:
    callback_port: ${authCallbackPort}
server:
  enabled: true
  address: 127.0.0.1
  port: ${API_PORT}
cache:
  enabled: true
  dir: "${cacheDir}"
  size_limit: "2GB"
`
}

export type LibrespotListener = (event: { type: string; data: unknown }) => void

class LibrespotManager {
  private proc: ChildProcessWithoutNullStreams | null = null
  private ws: WebSocket | null = null
  private listeners = new Set<LibrespotListener>()
  private configDir: string
  private ready = false
  private stopping = false
  private startAttempts = 0
  private lastAuthLinkOpenedAt = 0

  constructor() {
    this.configDir = path.join(app.getPath('userData'), 'librespot')
  }

  onEvent(cb: LibrespotListener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private emit(event: { type: string; data: unknown }): void {
    for (const l of this.listeners) l(event)
  }

  private checkForAuthLink(chunk: string): void {
    const match = chunk.match(AUTH_LINK_REGEX)
    if (!match) return
    this.emit({ type: '__auth_required', data: null })
    // Each fresh process has its own PKCE challenge, so a previously-opened
    // tab becomes stale as soon as go-librespot restarts — always open the
    // current link, just throttled so a fast crash-loop can't spam tabs.
    const now = Date.now()
    if (now - this.lastAuthLinkOpenedAt > 3000) {
      this.lastAuthLinkOpenedAt = now
      shell.openExternal(match[1])
    }
  }

  async start(): Promise<void> {
    if (!existsSync(this.configDir)) mkdirSync(this.configDir, { recursive: true })
    const authCallbackPort = await getFreePort()
    writeFileSync(
      path.join(this.configDir, 'config.yml'),
      buildConfigYaml(this.configDir, authCallbackPort),
      'utf-8'
    )

    const binPath = resolveBinaryPath()
    if (!existsSync(binPath)) {
      throw new Error(
        `go-librespot binary not found at ${binPath}. Run "npm run fetch:librespot" for your platform first.`
      )
    }

    this.stopping = false
    this.emit({ type: '__starting', data: null })

    let exited = false

    // Note: the flag is --config_dir (double dash); a single dash gets parsed
    // as `-c onfig_dir` by go-librespot's CLI.
    this.proc = spawn(binPath, ['--config_dir', this.configDir], {
      cwd: this.configDir,
      stdio: 'pipe'
    })

    this.proc.stdout.on('data', (d) => {
      process.stdout.write(`[go-librespot] ${d}`)
      this.checkForAuthLink(d.toString())
    })
    this.proc.stderr.on('data', (d) => {
      process.stderr.write(`[go-librespot] ${d}`)
      this.checkForAuthLink(d.toString())
    })

    this.proc.on('error', (err) => {
      exited = true
      this.handleUnexpectedExit(`impossible de lancer go-librespot.exe (${err.message})`)
    })

    this.proc.on('exit', (code, signal) => {
      exited = true
      this.ready = false
      this.emit({ type: '__process_exit', data: { code, signal } })
      if (!this.stopping) {
        this.handleUnexpectedExit(`go-librespot s'est arrêté de manière inattendue (code ${code ?? signal})`)
      }
    })

    try {
      await this.waitUntilReachable(() => exited)
    } catch (err) {
      if (!exited) {
        this.handleUnexpectedExit(
          `le lecteur audio ne répond pas — Windows Defender ou le pare-feu a peut-être bloqué go-librespot.exe. Vérifie qu'aucune fenêtre d'autorisation n'attend une réponse, puis relance l'app.`
        )
      }
      throw err
    }

    this.startAttempts = 0
    this.connectWebSocket()
    this.ready = true
    this.emit({ type: '__ready', data: null })
    this.pushStatus()
  }

  private handleUnexpectedExit(message: string): void {
    this.startAttempts += 1
    if (this.startAttempts > MAX_START_ATTEMPTS) {
      this.emit({ type: '__process_error', data: message })
      return
    }
    this.emit({ type: '__process_error', data: `${message} — nouvelle tentative…` })
    setTimeout(() => {
      this.start().catch(() => {
        // handleUnexpectedExit already emitted the error
      })
    }, Math.min(2000 * this.startAttempts, 10_000))
  }

  stop(): void {
    this.stopping = true // prevent auto-restart on intentional shutdown
    this.ws?.close()
    this.proc?.kill()
  }

  /** User-triggered retry after the auto-restart budget was exhausted, or to
   *  get a fresh auth link when a previous browser tab went stale. */
  async restart(): Promise<void> {
    this.startAttempts = 0
    this.lastAuthLinkOpenedAt = 0 // bypass the anti-spam throttle for a manual retry
    this.stop()
    await new Promise((r) => setTimeout(r, 300))
    await this.start()
  }

  private async waitUntilReachable(hasExited: () => boolean): Promise<void> {
    const deadline = Date.now() + 90_000
    while (Date.now() < deadline) {
      if (hasExited()) throw new Error('go-librespot exited before becoming reachable')
      try {
        const res = await fetch(`http://127.0.0.1:${API_PORT}/`)
        if (res.ok) return
      } catch {
        // not up yet
      }
      await new Promise((r) => setTimeout(r, 300))
    }
    throw new Error('go-librespot did not become reachable in time')
  }

  private connectWebSocket(): void {
    this.ws = new WebSocket(`ws://127.0.0.1:${API_PORT}/events`)
    this.ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString())
        this.emit(parsed)
      } catch {
        // ignore malformed frames
      }
      this.pushStatus()
    })
    this.ws.on('close', () => {
      if (this.ready) setTimeout(() => this.connectWebSocket(), 1000)
    })
    this.ws.on('error', () => {
      // 'close' will follow and trigger reconnect
    })
  }

  private async pushStatus(): Promise<void> {
    try {
      const status = await this.getStatus()
      this.emit({ type: '__status', data: status })
    } catch {
      this.emit({ type: '__status', data: null })
    }
  }

  private async call(method: 'GET' | 'POST', endpoint: string, body?: unknown): Promise<Response> {
    const res = await fetch(`http://127.0.0.1:${API_PORT}${endpoint}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
    if (!res.ok && res.status !== 204) {
      throw new Error(`go-librespot ${method} ${endpoint} failed: ${res.status} ${await res.text()}`)
    }
    return res
  }

  async getStatus(): Promise<LibrespotStatus | null> {
    const res = await this.call('GET', '/status')
    if (res.status === 204) return null
    return (await res.json()) as LibrespotStatus
  }

  async play(uri: string, opts?: { skipToUri?: string; paused?: boolean; position?: number }): Promise<void> {
    await this.call('POST', '/player/play', {
      uri,
      skip_to_uri: opts?.skipToUri,
      paused: opts?.paused,
      position: opts?.position
    })
    this.pushStatus()
  }

  async resume(): Promise<void> {
    await this.call('POST', '/player/resume')
    this.pushStatus()
  }

  async pause(): Promise<void> {
    await this.call('POST', '/player/pause')
    this.pushStatus()
  }

  async playPause(): Promise<void> {
    await this.call('POST', '/player/playpause')
    this.pushStatus()
  }

  async next(): Promise<void> {
    await this.call('POST', '/player/next')
    this.pushStatus()
  }

  async prev(): Promise<void> {
    await this.call('POST', '/player/prev')
    this.pushStatus()
  }

  async seek(positionMs: number): Promise<void> {
    await this.call('POST', '/player/seek', { position: positionMs })
    this.pushStatus()
  }

  async setVolume(volume: number): Promise<void> {
    await this.call('POST', '/player/volume', { volume })
    this.pushStatus()
  }

  async toggleShuffle(shuffle: boolean): Promise<void> {
    await this.call('POST', '/player/shuffle_context', { shuffle_context: shuffle })
    this.pushStatus()
  }

  async toggleRepeatContext(repeat: boolean): Promise<void> {
    await this.call('POST', '/player/repeat_context', { repeat_context: repeat })
    this.pushStatus()
  }

  async toggleRepeatTrack(repeat: boolean): Promise<void> {
    await this.call('POST', '/player/repeat_track', { repeat_track: repeat })
    this.pushStatus()
  }

  async addToQueue(uri: string): Promise<void> {
    await this.call('POST', '/player/add_to_queue', { uri })
  }
}

export const librespot = new LibrespotManager()
