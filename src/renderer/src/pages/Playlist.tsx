import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { SpotifyPlaylist, SpotifyTrack } from '../../../shared/types'
import TrackList from '../components/TrackList'
import { SkeletonRows } from '../components/Skeleton'

export default function Playlist() {
  const { id } = useParams<{ id: string }>()
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrack[] | null>(null)
  const [tracksFailed, setTracksFailed] = useState(false)

  useEffect(() => {
    if (!id) return
    setPlaylist(null)
    setTracks(null)
    setTracksFailed(false)
    window.cozy.spotify.playlist(id).then(setPlaylist).catch(() => setPlaylist(null))
    window.cozy.spotify
      .playlistTracks(id)
      .then(setTracks)
      .catch(() => {
        setTracks([])
        setTracksFailed(true)
      })
  }, [id])

  if (!id) return null

  const art = playlist?.images?.[0]?.url

  return (
    <div>
      <div className="playlist-hero">
        {art && <div className="playlist-hero-backdrop" style={{ backgroundImage: `url(${art})` }} />}
        <div className="playlist-hero-content">
          {art ? <img className="playlist-hero-art" src={art} alt="" /> : <div className="playlist-hero-art" />}
          <div>
            <div className="playlist-hero-kicker">Playlist</div>
            <h1 className="playlist-hero-title">{playlist?.name ?? 'Playlist'}</h1>
            <p className="playlist-hero-subtitle">
              {playlist?.items ? `${playlist.items.total} titres · ${playlist.owner?.display_name ?? ''}` : ' '}
            </p>
          </div>
        </div>
      </div>

      {tracksFailed ? (
        <div className="empty-state">
          Cette playlist n'est pas accessible via l'API Spotify — depuis février 2026, Spotify ne renvoie le
          contenu que des playlists que tu possèdes ou sur lesquelles tu collabores (pas les playlists suivies
          ni celles générées automatiquement comme Discover Weekly).
        </div>
      ) : tracks === null ? (
        <SkeletonRows count={8} />
      ) : (
        <TrackList tracks={tracks} contextUri={`spotify:playlist:${id}`} />
      )}
    </div>
  )
}
