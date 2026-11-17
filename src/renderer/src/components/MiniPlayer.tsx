import type { MouseEvent } from 'react'
import { usePlayerContext } from '../hooks/PlayerContext'
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from './icons'

export default function MiniPlayer() {
  const { status, displayPositionMs, playPause, next, prev, seek } = usePlayerContext()
  const track = status?.track ?? null
  const art = track?.album_cover_url ?? undefined
  const isPlaying = !!status && !status.paused && !status.stopped
  const duration = track?.duration ?? 0
  const progress = duration > 0 ? Math.min(displayPositionMs / duration, 1) : 0

  const handleSeekClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    seek(Math.round(ratio * duration))
  }

  return (
    <div className="mini-player">
      <button className="mini-player-close" onClick={() => window.cozy.windowControls.closeMiniPlayer()} aria-label="Fermer">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      </button>

      {art ? <img className="mini-player-art" src={art} alt="" /> : <div className="mini-player-art" />}

      <div className="mini-player-body">
        <div className="mini-player-title">{track?.name ?? 'Rien ne joue'}</div>
        <div className="mini-player-artist">{track?.artist_names.join(', ') ?? 'Cozy'}</div>
      </div>

      <div className="mini-player-controls">
        <button className="mini-player-btn" onClick={() => prev()} aria-label="Précédent">
          <PrevIcon width={14} height={14} />
        </button>
        <button className="mini-player-btn play" onClick={() => playPause()} aria-label="Lecture / Pause">
          {isPlaying ? <PauseIcon width={15} height={15} /> : <PlayIcon width={15} height={15} />}
        </button>
        <button className="mini-player-btn" onClick={() => next()} aria-label="Suivant">
          <NextIcon width={14} height={14} />
        </button>
      </div>

      <div className="mini-player-progress" onClick={handleSeekClick}>
        <div className="mini-player-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}
