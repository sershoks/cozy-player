import { useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerContext } from '../hooks/PlayerContext'
import { useDominantColor } from '../hooks/useDominantColor'
import { useClock } from '../hooks/useClock'
import { useIdle } from '../hooks/useIdle'
import Soundwave from './Soundwave'
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from './icons'

interface Props {
  onExit: () => void
}

export default function DisplayMode({ onExit }: Props) {
  const { status, displayPositionMs, playPause, next, prev } = usePlayerContext()
  const track = status?.track ?? null
  const art = track?.album_cover_url ?? undefined
  const isPlaying = !!status && !status.paused && !status.stopped
  const palette = useDominantColor(art)
  const now = useClock()
  const idle = useIdle(3500)

  // Entering fullscreen is idempotent (Electron no-ops if already there), so
  // it's safe even if an effect runs twice (React StrictMode in dev
  // double-invokes mount effects). Exiting, on the other hand, must only
  // happen on a real user action — doing it from this effect's cleanup used
  // to fire on StrictMode's phantom unmount too, immediately undoing the
  // fullscreen transition (enter → leave → enter, which Windows would just
  // settle back to "not fullscreen").
  useEffect(() => {
    window.cozy.windowControls.setFullScreen(true)
  }, [])

  const handleExit = useCallback(() => {
    window.cozy.windowControls.setFullScreen(false)
    onExit()
  }, [onExit])

  useEffect(() => {
    // The OS/window already left fullscreen by the time this fires (e.g. an
    // external shortcut) — just sync our state, don't call setFullScreen
    // again.
    return window.cozy.windowControls.onFullScreenChanged((full) => {
      if (!full) onExit()
    })
  }, [onExit])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit()
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault() // stop the space bar from "clicking" a focused button
        playPause()
      } else if (e.key === 'ArrowRight') {
        next()
      } else if (e.key === 'ArrowLeft') {
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleExit, playPause, next, prev])

  const duration = track?.duration ?? 0
  const progress = duration > 0 ? Math.min(displayPositionMs / duration, 1) : 0

  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={`display-mode${idle ? ' idle' : ''}`}>
      {art && <div className="display-mode-backdrop" style={{ backgroundImage: `url(${art})` }} />}
      <div className="display-mode-scrim" />

      <button className="display-mode-exit" onClick={handleExit} aria-label="Quitter le mode affichage">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      </button>

      <div className="display-mode-clock">
        <div className="display-mode-time font-display">{timeStr}</div>
        <div className="display-mode-date">{dateStr}</div>
      </div>

      <div className="display-mode-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={track?.uri ?? 'none'}
            className="display-mode-art-wrap"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {art ? (
              <img className="display-mode-art" src={art} alt="" />
            ) : (
              <div className="display-mode-art display-mode-art-empty" />
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={track?.uri ?? 'none-info'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="display-mode-info"
          >
            <div className="display-mode-title font-display">{track?.name ?? 'En pause'}</div>
            <div className="display-mode-artist">{track?.artist_names.join(', ') ?? 'Cozy'}</div>
          </motion.div>
        </AnimatePresence>

        <div className="display-mode-wave">
          <Soundwave playing={isPlaying} color={palette.glow1} />
        </div>

        <div className="display-mode-progress">
          <div className="display-mode-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="display-mode-controls">
        <button className="display-mode-control-btn" onClick={() => prev()} aria-label="Précédent">
          <PrevIcon width={20} height={20} />
        </button>
        <button className="display-mode-control-btn play" onClick={() => playPause()} aria-label="Lecture / Pause">
          {isPlaying ? <PauseIcon width={22} height={22} /> : <PlayIcon width={22} height={22} />}
        </button>
        <button className="display-mode-control-btn" onClick={() => next()} aria-label="Suivant">
          <NextIcon width={20} height={20} />
        </button>
      </div>
    </div>
  )
}
