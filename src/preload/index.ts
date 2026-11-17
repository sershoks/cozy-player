import { contextBridge, ipcRenderer } from 'electron'
import type { LibrespotStatus, SpotifyPlaylist, SpotifyProfile, SpotifySearchResults, SpotifyTrack } from '../shared/types'

const player = {
  getStatus: (): Promise<LibrespotStatus | null> => ipcRenderer.invoke('player:getStatus'),
  play: (uri: string, opts?: { skipToUri?: string; paused?: boolean; position?: number }) =>
    ipcRenderer.invoke('player:play', uri, opts),
  resume: () => ipcRenderer.invoke('player:resume'),
  pause: () => ipcRenderer.invoke('player:pause'),
  playPause: () => ipcRenderer.invoke('player:playPause'),
  next: () => ipcRenderer.invoke('player:next'),
  prev: () => ipcRenderer.invoke('player:prev'),
  seek: (ms: number) => ipcRenderer.invoke('player:seek', ms),
  setVolume: (v: number) => ipcRenderer.invoke('player:setVolume', v),
  toggleShuffle: (v: boolean) => ipcRenderer.invoke('player:toggleShuffle', v),
  toggleRepeatContext: (v: boolean) => ipcRenderer.invoke('player:toggleRepeatContext', v),
  toggleRepeatTrack: (v: boolean) => ipcRenderer.invoke('player:toggleRepeatTrack', v),
  addToQueue: (uri: string) => ipcRenderer.invoke('player:addToQueue', uri),
  restart: () => ipcRenderer.invoke('player:restart'),
  onEvent: (cb: (event: { type: string; data: unknown }) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, payload: { type: string; data: unknown }): void =>
      cb(payload)
    ipcRenderer.on('librespot:event', listener)
    return () => ipcRenderer.removeListener('librespot:event', listener)
  }
}

const auth = {
  isLoggedIn: (): Promise<boolean> => ipcRenderer.invoke('auth:isLoggedIn'),
  getClientId: (): Promise<string | null> => ipcRenderer.invoke('auth:getClientId'),
  setClientId: (clientId: string) => ipcRenderer.invoke('auth:setClientId', clientId),
  getRedirectUri: (): Promise<string> => ipcRenderer.invoke('auth:getRedirectUri'),
  login: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  onChanged: (cb: (loggedIn: boolean) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, loggedIn: boolean): void => cb(loggedIn)
    ipcRenderer.on('auth:changed', listener)
    return () => ipcRenderer.removeListener('auth:changed', listener)
  }
}

const spotify = {
  me: (): Promise<SpotifyProfile> => ipcRenderer.invoke('spotify:me'),
  myPlaylists: (): Promise<SpotifyPlaylist[]> => ipcRenderer.invoke('spotify:myPlaylists'),
  playlist: (id: string): Promise<SpotifyPlaylist> => ipcRenderer.invoke('spotify:playlist', id),
  playlistTracks: (id: string): Promise<SpotifyTrack[]> => ipcRenderer.invoke('spotify:playlistTracks', id),
  savedTracks: (): Promise<SpotifyTrack[]> => ipcRenderer.invoke('spotify:savedTracks'),
  topTracks: (): Promise<SpotifyTrack[]> => ipcRenderer.invoke('spotify:topTracks'),
  recentlyPlayed: (): Promise<SpotifyTrack[]> => ipcRenderer.invoke('spotify:recentlyPlayed'),
  search: (query: string, types?: string[]): Promise<SpotifySearchResults> =>
    ipcRenderer.invoke('spotify:search', query, types),
  checkSaved: (uris: string[]): Promise<boolean[]> => ipcRenderer.invoke('spotify:checkSaved', uris),
  saveTrack: (uri: string) => ipcRenderer.invoke('spotify:saveTrack', uri),
  removeSavedTrack: (uri: string) => ipcRenderer.invoke('spotify:removeSavedTrack', uri)
}

const windowControls = {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  setFullScreen: (value: boolean) => ipcRenderer.send('window:setFullScreen', value),
  isFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:isFullScreen'),
  toggleMiniPlayer: () => ipcRenderer.send('window:toggleMiniPlayer'),
  closeMiniPlayer: () => ipcRenderer.send('window:closeMiniPlayer'),
  onFullScreenChanged: (cb: (value: boolean) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, value: boolean): void => cb(value)
    ipcRenderer.on('window:fullScreenChanged', listener)
    return () => ipcRenderer.removeListener('window:fullScreenChanged', listener)
  }
}

const api = { player, auth, spotify, windowControls }

contextBridge.exposeInMainWorld('cozy', api)

export type CozyApi = typeof api
