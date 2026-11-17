import { Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import Onboarding from './components/Onboarding'
import DeviceHint from './components/DeviceHint'
import ErrorBoundary from './components/ErrorBoundary'
import AmbientGlow from './components/AmbientGlow'
import DisplayMode from './components/DisplayMode'
import Home from './pages/Home'
import Search from './pages/Search'
import Playlist from './pages/Playlist'
import Library from './pages/Library'
import { useAuth } from './hooks/useAuth'
import { PlayerProvider, usePlayerContext } from './hooks/PlayerContext'

function RoutedContent() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playlist/:id" element={<Playlist />} />
        </Routes>
      </motion.div>
    </ErrorBoundary>
  )
}

export default function App() {
  const { loggedIn } = useAuth()

  if (loggedIn === null) {
    return <div className="app-shell" />
  }

  if (!loggedIn) {
    return (
      <div className="app-shell">
        <div className="ambient-glow" aria-hidden>
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />
          <div className="ambient-blob ambient-blob-3" />
          <div className="ambient-grain" />
        </div>
        <TitleBar />
        <Onboarding />
      </div>
    )
  }

  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  )
}

function AppShell() {
  const { displayMode, closeDisplayMode } = usePlayerContext()

  if (displayMode) {
    return <DisplayMode onExit={closeDisplayMode} />
  }

  return (
    <div className="app-shell">
      <AmbientGlow />
      <TitleBar />
      <div className="body-row">
        <Sidebar />
        <main className="main-content scroll-region">
          <DeviceHint />
          <RoutedContent />
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}
