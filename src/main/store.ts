import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

interface Settings {
  spotifyClientId?: string
}

interface TokenSet {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

const userDataDir = () => app.getPath('userData')
const settingsPath = () => path.join(userDataDir(), 'settings.json')
const tokensPath = () => path.join(userDataDir(), 'tokens.bin')

function ensureUserDataDir(): void {
  const dir = userDataDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function readSettings(): Settings {
  try {
    return JSON.parse(readFileSync(settingsPath(), 'utf-8'))
  } catch {
    return {}
  }
}

export function writeSettings(patch: Partial<Settings>): Settings {
  ensureUserDataDir()
  const next = { ...readSettings(), ...patch }
  writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}

export function readTokens(): TokenSet | null {
  if (!existsSync(tokensPath())) return null
  try {
    const raw = readFileSync(tokensPath())
    const decrypted = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf-8')
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

export function writeTokens(tokens: TokenSet): void {
  ensureUserDataDir()
  const json = JSON.stringify(tokens)
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(json)
    : Buffer.from(json, 'utf-8')
  writeFileSync(tokensPath(), payload)
}

export function clearTokens(): void {
  try {
    writeFileSync(tokensPath(), Buffer.alloc(0))
  } catch {
    // ignore
  }
}

export type { Settings, TokenSet }
