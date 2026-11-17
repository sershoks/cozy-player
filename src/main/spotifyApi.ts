import { spotifyAuth } from './spotifyAuth'
import type { SpotifyPlaylist, SpotifyProfile, SpotifySearchResults, SpotifyTrack } from '../shared/types'

const BASE = 'https://api.spotify.com/v1'
const PLAYLIST_ITEMS_PAGE_SIZE = 50
const PLAYLIST_ITEMS_MAX = 1000 // safety cap so a huge playlist can't loop forever
const LIBRARY_BATCH_SIZE = 40 // Spotify's hard cap on /me/library(/contains) uris

async function apiGet<T>(pathAndQuery: string): Promise<T> {
  const token = await spotifyAuth.getValidAccessToken()
  const res = await fetch(`${BASE}${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error(`Spotify API ${pathAndQuery} failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

async function apiWrite(method: 'PUT' | 'DELETE', pathAndQuery: string): Promise<void> {
  const token = await spotifyAuth.getValidAccessToken()
  const res = await fetch(`${BASE}${pathAndQuery}`, {
    method,
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error(`Spotify API ${method} ${pathAndQuery} failed: ${res.status} ${await res.text()}`)
  }
}

export const spotifyApi = {
  me: () => apiGet<SpotifyProfile>('/me'),

  myPlaylists: () =>
    apiGet<{ items: SpotifyPlaylist[] }>('/me/playlists?limit=50').then((r) => r.items),

  // Spotify's Feb 2026 API migration renamed the playlist "tracks" sub-resource
  // to "items" (GET /playlists/{id}/tracks now 403s); the field on the
  // playlist object itself was renamed the same way. Items are only returned
  // for playlists the user owns or collaborates on.
  playlist: (playlistId: string) =>
    apiGet<SpotifyPlaylist>(
      `/playlists/${encodeURIComponent(playlistId)}?fields=id,name,description,images,items(total),owner(display_name)`
    ),

  playlistTracks: async (playlistId: string): Promise<SpotifyTrack[]> => {
    const tracks: SpotifyTrack[] = []
    let offset = 0
    while (offset < PLAYLIST_ITEMS_MAX) {
      const page = await apiGet<{ items: { item: SpotifyTrack | null }[]; next: string | null }>(
        `/playlists/${encodeURIComponent(playlistId)}/items?limit=${PLAYLIST_ITEMS_PAGE_SIZE}&offset=${offset}&additional_types=track`
      )
      tracks.push(...page.items.map((i) => i.item).filter((t): t is SpotifyTrack => !!t))
      if (!page.next || page.items.length === 0) break
      offset += PLAYLIST_ITEMS_PAGE_SIZE
    }
    return tracks
  },

  savedTracks: () =>
    apiGet<{ items: { track: SpotifyTrack }[] }>('/me/tracks?limit=50').then((r) =>
      r.items.map((i) => i.track)
    ),

  topTracks: () =>
    apiGet<{ items: SpotifyTrack[] }>('/me/top/tracks?limit=20&time_range=short_term').then(
      (r) => r.items
    ),

  recentlyPlayed: () =>
    apiGet<{ items: { track: SpotifyTrack }[] }>('/me/player/recently-played?limit=20').then(
      (r) => r.items.map((i) => i.track)
    ),

  // Search's max/default limit dropped (50->10 / 20->5) in the same migration.
  search: (query: string, types: string[] = ['track', 'album', 'artist', 'playlist']) =>
    apiGet<SpotifySearchResults>(
      `/search?q=${encodeURIComponent(query)}&type=${types.join(',')}&limit=10`
    ),

  // Feb 2026 migration consolidated per-type save/remove/check endpoints
  // (e.g. PUT /me/tracks) into a single /me/library resource shared by
  // tracks, albums, episodes, shows, etc.
  checkSaved: async (uris: string[]): Promise<boolean[]> => {
    const results: boolean[] = []
    for (let i = 0; i < uris.length; i += LIBRARY_BATCH_SIZE) {
      const batch = uris.slice(i, i + LIBRARY_BATCH_SIZE)
      const chunk = await apiGet<boolean[]>(
        `/me/library/contains?uris=${batch.map(encodeURIComponent).join(',')}`
      )
      results.push(...chunk)
    }
    return results
  },

  saveTrack: (uri: string) => apiWrite('PUT', `/me/library?uris=${encodeURIComponent(uri)}`),

  removeSavedTrack: (uri: string) => apiWrite('DELETE', `/me/library?uris=${encodeURIComponent(uri)}`)
}
