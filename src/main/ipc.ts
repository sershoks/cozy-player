import { ipcMain, BrowserWindow } from 'electron'
import { librespot } from './librespot'
import { spotifyAuth } from './spotifyAuth'
import { spotifyApi } from './spotifyApi'

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  // --- player ---
  ipcMain.handle('player:getStatus', () => librespot.getStatus())
  ipcMain.handle('player:play', (_e, uri: string, opts) => librespot.play(uri, opts))
  ipcMain.handle('player:resume', () => librespot.resume())
  ipcMain.handle('player:pause', () => librespot.pause())
  ipcMain.handle('player:playPause', () => librespot.playPause())
  ipcMain.handle('player:next', () => librespot.next())
  ipcMain.handle('player:prev', () => librespot.prev())
  ipcMain.handle('player:seek', (_e, ms: number) => librespot.seek(ms))
  ipcMain.handle('player:setVolume', (_e, v: number) => librespot.setVolume(v))
  ipcMain.handle('player:toggleShuffle', (_e, v: boolean) => librespot.toggleShuffle(v))
  ipcMain.handle('player:toggleRepeatContext', (_e, v: boolean) => librespot.toggleRepeatContext(v))
  ipcMain.handle('player:toggleRepeatTrack', (_e, v: boolean) => librespot.toggleRepeatTrack(v))
  ipcMain.handle('player:addToQueue', (_e, uri: string) => librespot.addToQueue(uri))
  ipcMain.handle('player:restart', () => librespot.restart())

  librespot.onEvent((event) => {
    // Broadcast to every window (main + mini player) so they always agree
    // on playback state, rather than tying this to a single "the" window.
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('librespot:event', event)
    }
  })

  // --- auth ---
  ipcMain.handle('auth:isLoggedIn', () => spotifyAuth.isLoggedIn())
  ipcMain.handle('auth:getClientId', () => spotifyAuth.getClientId() ?? null)
  ipcMain.handle('auth:setClientId', (_e, clientId: string) => spotifyAuth.setClientId(clientId))
  ipcMain.handle('auth:getRedirectUri', () => spotifyAuth.redirectUri)
  ipcMain.handle('auth:login', () => spotifyAuth.login())
  ipcMain.handle('auth:logout', () => spotifyAuth.logout())

  spotifyAuth.setOnChange((loggedIn) => {
    getWindow()?.webContents.send('auth:changed', loggedIn)
  })

  // --- spotify web api ---
  ipcMain.handle('spotify:me', () => spotifyApi.me())
  ipcMain.handle('spotify:myPlaylists', () => spotifyApi.myPlaylists())
  ipcMain.handle('spotify:playlist', (_e, id: string) => spotifyApi.playlist(id))
  ipcMain.handle('spotify:playlistTracks', (_e, id: string) => spotifyApi.playlistTracks(id))
  ipcMain.handle('spotify:savedTracks', () => spotifyApi.savedTracks())
  ipcMain.handle('spotify:topTracks', () => spotifyApi.topTracks())
  ipcMain.handle('spotify:recentlyPlayed', () => spotifyApi.recentlyPlayed())
  ipcMain.handle('spotify:search', (_e, query: string, types?: string[]) =>
    spotifyApi.search(query, types)
  )
  ipcMain.handle('spotify:checkSaved', (_e, uris: string[]) => spotifyApi.checkSaved(uris))
  ipcMain.handle('spotify:saveTrack', (_e, uri: string) => spotifyApi.saveTrack(uri))
  ipcMain.handle('spotify:removeSavedTrack', (_e, uri: string) => spotifyApi.removeSavedTrack(uri))
}
