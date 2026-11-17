import { createContext, useContext, ReactNode } from 'react'
import { usePlayer } from './usePlayer'

type PlayerContextValue = ReturnType<typeof usePlayer>

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const value = usePlayer()
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerProvider')
  return ctx
}
