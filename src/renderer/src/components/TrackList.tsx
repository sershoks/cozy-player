import type { SpotifyTrack } from '../../../shared/types'
import { usePlayerContext } from '../hooks/PlayerContext'
import { useSavedTracks } from '../hooks/useSavedTracks'
import { artistNames, formatMs } from '../lib/format'
import { HeartIcon } from './icons'

interface Props {
  tracks: SpotifyTrack[]
  contextUri?: string
  showIndex?: boolean
}

function EqBars() {
  return (
    <span className="eq-bars" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  )
}

export default function TrackList({ tracks, contextUri, showIndex = true }: Props) {
  const { status, play } = usePlayerContext()
  const { isSaved, toggle } = useSavedTracks(tracks.map((t) => t.uri))

  const handlePlay = (track: SpotifyTrack) => {
    if (contextUri) {
      play(contextUri, { skipToUri: track.uri })
    } else {
      play(track.uri)
    }
  }

  if (tracks.length === 0) {
    return <div className="empty-state">Rien ici pour l'instant.</div>
  }

  return (
    <div className="track-list">
      {tracks.map((track, i) => {
        const isPlaying = status?.track?.uri === track.uri
        const art = track.album?.images?.[track.album.images.length - 1]?.url
        const saved = isSaved(track.uri)
        return (
          <div
            key={`${track.id}-${i}`}
            className={`track-row${isPlaying ? ' playing' : ''}`}
            style={{ animationDelay: `${Math.min(i * 12, 400)}ms` }}
            onDoubleClick={() => handlePlay(track)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePlay(track)
            }}
            role="button"
            tabIndex={0}
            title="Double-clique pour lire"
          >
            {showIndex ? <span className="track-row-index">{isPlaying ? <EqBars /> : i + 1}</span> : <span />}
            {art ? <img className="track-row-art" src={art} alt="" /> : <div className="track-row-art" />}
            <div className="track-row-info">
              <span className="track-row-name">{track.name}</span>
              <span className="track-row-artist">{artistNames(track.artists)}</span>
            </div>
            <button
              className={`track-heart-btn${saved ? ' saved' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggle(track.uri)
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              aria-label={saved ? 'Retirer des titres likés' : 'Ajouter aux titres likés'}
              title={saved ? 'Retirer des titres likés' : 'Aimer ce titre'}
            >
              <HeartIcon width={15} height={15} filled={saved} />
            </button>
            <span className="track-row-duration">{formatMs(track.duration_ms)}</span>
          </div>
        )
      })}
    </div>
  )
}
