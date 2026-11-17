import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { shell } from 'electron'
import { readSettings, writeSettings, readTokens, writeTokens, clearTokens, TokenSet } from './store'

const REDIRECT_PORT = 43231
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'user-read-recently-played',
  'user-read-currently-playing',
  'user-read-playback-state'
].join(' ')

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(64))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

class SpotifyAuth {
  private tokens: TokenSet | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private onChange: ((loggedIn: boolean) => void) | null = null

  constructor() {
    this.tokens = readTokens()
    if (this.tokens) this.scheduleRefresh()
  }

  setOnChange(cb: (loggedIn: boolean) => void): void {
    this.onChange = cb
  }

  getClientId(): string | undefined {
    return readSettings().spotifyClientId
  }

  setClientId(clientId: string): void {
    writeSettings({ spotifyClientId: clientId.trim() })
  }

  get redirectUri(): string {
    return REDIRECT_URI
  }

  isLoggedIn(): boolean {
    return !!this.tokens?.refreshToken
  }

  logout(): void {
    this.tokens = null
    clearTokens()
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    this.onChange?.(false)
  }

  /** Opens the system browser for login and resolves once tokens are stored. */
  async login(): Promise<void> {
    const clientId = this.getClientId()
    if (!clientId) throw new Error('Missing Spotify Client ID — set it in onboarding first.')

    const { verifier, challenge } = pkcePair()
    const state = base64url(randomBytes(16))

    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', SCOPES)

    const code = await this.awaitCallback(authUrl.toString(), state)
    const tokens = await this.exchangeCode(code, verifier, clientId)
    this.tokens = tokens
    writeTokens(tokens)
    this.scheduleRefresh()
    this.onChange?.(true)
  }

  private awaitCallback(authUrl: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', REDIRECT_URI)
        if (url.pathname !== '/callback') {
          res.writeHead(404).end()
          return
        }
        const error = url.searchParams.get('error')
        const state = url.searchParams.get('state')
        const code = url.searchParams.get('code')

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(
          `<!doctype html><html><body style="font-family:sans-serif;background:#1b1512;color:#f1e7da;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>${
            error ? 'Connexion annulée, tu peux fermer cet onglet.' : 'Connecté ! Tu peux fermer cet onglet et revenir à Cozy.'
          }</p></body></html>`
        )

        server.close()
        if (error) {
          reject(new Error(`Spotify auth error: ${error}`))
        } else if (state !== expectedState) {
          reject(new Error('Spotify auth state mismatch'))
        } else if (!code) {
          reject(new Error('Spotify auth: no code returned'))
        } else {
          resolve(code)
        }
      })

      server.listen(REDIRECT_PORT, '127.0.0.1', () => {
        shell.openExternal(authUrl)
      })

      server.on('error', reject)

      setTimeout(() => {
        server.close()
        reject(new Error('Spotify login timed out'))
      }, 5 * 60 * 1000)
    })
  }

  private async exchangeCode(code: string, verifier: string, clientId: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
    return this.requestTokens(body)
  }

  private async refreshTokens(): Promise<TokenSet> {
    if (!this.tokens?.refreshToken) throw new Error('No refresh token available')
    const clientId = this.getClientId()
    if (!clientId) throw new Error('Missing Spotify Client ID')
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refreshToken
    })
    return this.requestTokens(body, this.tokens.refreshToken)
  }

  private async requestTokens(body: URLSearchParams, fallbackRefreshToken?: string): Promise<TokenSet> {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!res.ok) {
      throw new Error(`Spotify token request failed: ${res.status} ${await res.text()}`)
    }
    const json = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }
    const tokens: TokenSet = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? fallbackRefreshToken ?? '',
      expiresAt: Date.now() + json.expires_in * 1000
    }
    writeTokens(tokens)
    this.tokens = tokens
    return tokens
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    if (!this.tokens) return
    const msUntilRefresh = Math.max(this.tokens.expiresAt - Date.now() - 60_000, 5_000)
    this.refreshTimer = setTimeout(() => {
      this.refreshTokens().then(() => this.scheduleRefresh()).catch(() => this.logout())
    }, msUntilRefresh)
  }

  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) throw new Error('Not logged in')
    if (this.tokens.expiresAt - Date.now() < 60_000) {
      await this.refreshTokens()
    }
    return this.tokens.accessToken
  }
}

export const spotifyAuth = new SpotifyAuth()
