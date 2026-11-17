export interface LibrespotTrack {
  uri: string
  name: string
  artist_names: string[]
  album_name: string
  album_cover_url: string | null
  position: number
  duration: number
  release_date: string
  track_number: number
  disc_number: number
  format: string
  codec: string
  bitrate: number | null
  sample_rate: number | null
  bit_depth: number | null
}

export interface LibrespotStatus {
  username: string
  device_id: string
  device_type: string
  device_name: string
  play_origin: string
  stopped: boolean
  paused: boolean
  buffering: boolean
  volume: number
  volume_steps: number
  repeat_context: boolean
  repeat_track: boolean
  shuffle_context: boolean
  track: LibrespotTrack | null
}

export type LibrespotEvent = { type: string; data: unknown }

export interface SpotifyProfile {
  id: string
  display_name: string | null
  email?: string
  images: { url: string }[]
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: { url: string }[]
  // Renamed from `tracks` in Spotify's Feb 2026 API migration.
  items: { total: number }
  owner: { display_name: string | null }
}

export interface SpotifyTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  artists: { name: string; id: string }[]
  album: { name: string; images: { url: string }[]; id: string }
}

export interface SpotifySearchResults {
  tracks?: { items: SpotifyTrack[] }
  albums?: { items: { id: string; name: string; images: { url: string }[]; artists: { name: string }[] }[] }
  artists?: { items: { id: string; name: string; images: { url: string }[] }[] }
  playlists?: { items: SpotifyPlaylist[] }
}
