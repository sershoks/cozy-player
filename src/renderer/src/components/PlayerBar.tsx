import { AnimatePresence, motion } from 'framer-motion'
import { usePlayerContext } from '../hooks/PlayerContext'
import { formatMs } from '../lib/format'
import { ExpandIcon, MiniPlayerIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon, VolumeIcon } from './icons'

export default function PlayerBar() {
  const {
    status,
    displayPositionMs,
    playPause,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeatContext,
    openDisplayMode
  } = usePlayerContext()

  const track = status?.track ?? null
  const art = track?.album_cover_url ?? undefined
  const isPlaying = !!status && !status.paused && !status.stopped
  const duration = track?.duration ?? 0
  const seekProgress = duration > 0 ? `${(Math.min(displayPositionMs, duration) / duration) * 100}%` : '0%'

  return (
    <div className="player-bar">
      {art && <div className="player-bar-backdrop" style={{ backgroundImage: `url(${art})` }} />}
      <div className="player-bar-scrim" />

      <div className="now-playing">
        <div className={`now-playing-art-wrap${isPlaying ? ' playing' : ''}`}>
          {art ? <img className="now-playing-art" src={art} alt="" /> : <div className="now-playing-art" />}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={track?.uri ?? 'none'}
            className="now-playing-info"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="now-playing-name">{track?.name ?? 'Rien ne joue'}</div>
            <div className="now-playing-artist">{track?.artist_names.join(', ') ?? '—'}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="player-center">
        <div className="transport-controls">
          <button
            className={`transport-btn${status?.shuffle_context ? ' active' : ''}`}
            onClick={() => toggleShuffle(!status?.shuffle_context)}
            title="Aléatoire"
          >
            <ShuffleIcon width={15} height={15} />
          </button>
          <button className="transport-btn" onClick={() => prev()} title="Précédent">
            <PrevIcon width={17} height={17} />
          </button>
          <button className="transport-btn play" onClick={() => playPause()} title="Lecture / Pause">
            {isPlaying ? <PauseIcon width={17} height={17} /> : <PlayIcon width={17} height={17} />}
          </button>
          <button className="transport-btn" onClick={() => next()} title="Suivant">
            <NextIcon width={17} height={17} />
          </button>
          <button
            className={`transport-btn${status?.repeat_context ? ' active' : ''}`}
            onClick={() => toggleRepeatContext(!status?.repeat_context)}
            title="Répéter"
          >
            <RepeatIcon width={15} height={15} />
          </button>
        </div>

        <div className="progress-row">
          <span className="time-label">{formatMs(displayPositionMs)}</span>
          <input
            className="seek-slider"
            type="range"
            min={0}
            max={duration}
            value={Math.min(displayPositionMs, duration)}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!track}
            style={{ ['--seek-progress' as string]: seekProgress }}
          />
          <span className="time-label end">{formatMs(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <VolumeIcon width={16} height={16} style={{ color: 'var(--text-muted)' }} />
        <input
          className="volume-slider"
          type="range"
          min={0}
          max={status?.volume_steps ?? 100}
          value={status?.volume ?? 0}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <button
          className="player-display-btn"
          onClick={() => window.cozy.windowControls.toggleMiniPlayer()}
          title="Mini-lecteur flottant"
        >
          <MiniPlayerIcon width={15} height={15} />
        </button>
        <button className="player-display-btn" onClick={openDisplayMode} title="Mode affichage plein écran">
          <ExpandIcon width={15} height={15} />
        </button>
      </div>
    </div>
  )
}
