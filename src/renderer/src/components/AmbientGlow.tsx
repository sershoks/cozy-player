import { useEffect } from 'react'
import { usePlayerContext } from '../hooks/PlayerContext'
import { useDominantColor } from '../hooks/useDominantColor'

export default function AmbientGlow() {
  const { status } = usePlayerContext()
  const palette = useDominantColor(status?.track?.album_cover_url)

  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--glow-1', palette.glow1)
    root.setProperty('--glow-2', palette.glow2)
    root.setProperty('--glow-3', palette.glow3)
  }, [palette])

  return (
    <div className="ambient-glow" aria-hidden>
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
      <div className="ambient-grain" />
    </div>
  )
}
