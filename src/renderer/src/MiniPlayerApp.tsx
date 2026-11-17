import { PlayerProvider } from './hooks/PlayerContext'
import MiniPlayer from './components/MiniPlayer'

export default function MiniPlayerApp() {
  return (
    <PlayerProvider>
      <MiniPlayer />
    </PlayerProvider>
  )
}
