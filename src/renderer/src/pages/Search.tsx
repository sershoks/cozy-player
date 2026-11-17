import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SpotifySearchResults } from '../../../shared/types'
import TrackList from '../components/TrackList'
import { SkeletonCards, SkeletonRows } from '../components/Skeleton'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifySearchResults | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const navigate = useNavigate()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults(null)
      return
    }
    debounceRef.current = setTimeout(() => {
      window.cozy.spotify
        .search(query.trim(), ['track', 'playlist'])
        .then(setResults)
        .catch(() => setResults(null))
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div>
      <h1 className="page-title">Recherche</h1>
      <div className="search-input-wrap">
        <svg
          className="search-input-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titres, artistes, playlists…"
          autoFocus
        />
      </div>

      {results?.playlists?.items && results.playlists.items.length > 0 && (
        <div className="section">
          <h2 className="section-title">Playlists</h2>
          <div className="card-grid">
            {results.playlists.items.filter(Boolean).map((p) => (
              <div key={p.id} className="card" onClick={() => navigate(`/playlist/${p.id}`)}>
                {p.images?.[0]?.url ? <img className="card-art" src={p.images[0].url} alt="" /> : <div className="card-art" />}
                <div className="card-title">{p.name}</div>
                <div className="card-subtitle">{p.owner?.display_name ?? ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results?.tracks?.items && (
        <div className="section">
          <h2 className="section-title">Titres</h2>
          <TrackList tracks={results.tracks.items} showIndex={false} />
        </div>
      )}

      {query.trim() && !results && (
        <>
          <div className="section">
            <SkeletonCards count={4} />
          </div>
          <SkeletonRows count={5} />
        </>
      )}
    </div>
  )
}
