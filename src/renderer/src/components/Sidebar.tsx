import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { SpotifyPlaylist } from '../../../shared/types'
import { useAuth } from '../hooks/useAuth'

const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const LibraryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19V5a1 1 0 0 1 1-1h3v16H5a1 1 0 0 1-1-1Z" />
    <path d="M10 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5Z" />
    <path d="m18.5 4.3 2 14a1 1 0 0 1-.85 1.13l-1.98.28" />
  </svg>
)

function NavPill() {
  return <motion.span className="nav-item-pill" layoutId="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
}

export default function Sidebar() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const { logout } = useAuth()

  useEffect(() => {
    window.cozy.spotify.myPlaylists().then(setPlaylists).catch(() => setPlaylists([]))
  }, [])

  return (
    <aside className="sidebar">
      <nav className="nav-list">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <NavPill />}
              <HomeIcon />
              Accueil
            </>
          )}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <NavPill />}
              <SearchIcon />
              Recherche
            </>
          )}
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <NavPill />}
              <LibraryIcon />
              Bibliothèque
            </>
          )}
        </NavLink>
      </nav>

      <div className="sidebar-playlists">
        <div className="sidebar-section-title">Playlists</div>
        <div className="playlist-list scroll-region">
          {playlists.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
            >
              <NavLink to={`/playlist/${p.id}`} className={({ isActive }) => `playlist-item${isActive ? ' active' : ''}`} title={p.name}>
                {p.name}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </div>

      <button className="sidebar-logout" onClick={logout}>
        Se déconnecter
      </button>
    </aside>
  )
}
