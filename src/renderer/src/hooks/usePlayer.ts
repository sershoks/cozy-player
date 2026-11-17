import { useCallback, useEffect, useRef, useState } from 'react'
import type { LibrespotStatus } from '../../../shared/types'

export type EngineState = 'starting' | 'ready' | 'error'

export function usePlayer() {
  const [status, setStatus] = useState<LibrespotStatus | null>(null)
  const [engineState, setEngineState] = useState<EngineState>('starting')
  const [engineMessage, setEngineMessage] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [displayPositionMs, setDisplayPositionMs] = useState(0)
  const [displayMode, setDisplayMode] = useState(false)
  const lastStatusAt = useRef<number>(Date.now())

  useEffect(() => {
    window.cozy.player
      .getStatus()
      .then((s) => {
        // A successful round-trip means the API is reachable — the '__ready'
        // event may well have fired before this listener was even attached.
        setEngineState('ready')
        setStatus(s)
        lastStatusAt.current = Date.now()
        if (s?.track) setDisplayPositionMs(s.track.position)
      })
      .catch(() => {
        // engine not up yet — the '__starting'/'__ready' events drive state
      })

    return window.cozy.player.onEvent((event) => {
      if (event.type === '__starting') {
        setEngineState('starting')
        setEngineMessage(null)
      }
      if (event.type === '__ready') {
        setEngineState('ready')
        setEngineMessage(null)
      }
      if (event.type === '__process_error') {
        setEngineState('error')
        setEngineMessage(String(event.data))
      }
      if (event.type === '__auth_required') {
        setAuthRequired(true)
      }
      if (event.type === '__status') {
        const s = event.data as LibrespotStatus | null
        setStatus(s)
        if (s) {
          setAuthRequired(false)
          setEngineState('ready')
        }
        lastStatusAt.current = Date.now()
        if (s?.track) setDisplayPositionMs(s.track.position)
      }
    })
  }, [])

  useEffect(() => {
    if (!status?.track || status.paused || status.stopped || status.buffering) return
    const id = setInterval(() => {
      const elapsed = Date.now() - lastStatusAt.current
      setDisplayPositionMs(Math.min((status.track?.position ?? 0) + elapsed, status.track?.duration ?? 0))
    }, 500)
    return () => clearInterval(id)
  }, [status])

  const play = useCallback(
    (uri: string, opts?: { skipToUri?: string; paused?: boolean; position?: number }) => window.cozy.player.play(uri, opts),
    []
  )
  const playPause = useCallback(() => window.cozy.player.playPause(), [])
  const next = useCallback(() => window.cozy.player.next(), [])
  const prev = useCallback(() => window.cozy.player.prev(), [])
  const seek = useCallback((ms: number) => {
    setDisplayPositionMs(ms)
    return window.cozy.player.seek(ms)
  }, [])
  const setVolume = useCallback((v: number) => window.cozy.player.setVolume(v), [])
  const toggleShuffle = useCallback((v: boolean) => window.cozy.player.toggleShuffle(v), [])
  const toggleRepeatContext = useCallback((v: boolean) => window.cozy.player.toggleRepeatContext(v), [])
  const toggleRepeatTrack = useCallback((v: boolean) => window.cozy.player.toggleRepeatTrack(v), [])
  const addToQueue = useCallback((uri: string) => window.cozy.player.addToQueue(uri), [])
  const restart = useCallback(() => {
    setEngineState('starting')
    setEngineMessage(null)
    return window.cozy.player.restart()
  }, [])
  const openDisplayMode = useCallback(() => setDisplayMode(true), [])
  const closeDisplayMode = useCallback(() => setDisplayMode(false), [])

  return {
    status,
    engineState,
    engineMessage,
    authRequired,
    ready: engineState === 'ready',
    displayPositionMs,
    play,
    playPause,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeatContext,
    toggleRepeatTrack,
    addToQueue,
    restart,
    displayMode,
    openDisplayMode,
    closeDisplayMode
  }
}
