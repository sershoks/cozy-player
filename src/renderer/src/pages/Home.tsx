import { useEffect, useState } from 'react'
import type { SpotifyTrack } from '../../../shared/types'
import TrackList from '../components/TrackList'
import { SkeletonRows } from '../components/Skeleton'

export default function Home() {
  const [recent, setRecent] = useState<SpotifyTrack[] | null>(null)
  const [top, setTop] = useState<SpotifyTrack[] | null>(null)

  useEffect(() => {
    window.cozy.spotify.recentlyPlayed().then(setRecent).catch(() => setRecent([]))
    window.cozy.spotify.topTracks().then(setTop).catch(() => setTop([]))
  }, [])

  return (
    <div>
      <h1 className="page-title">Bon retour</h1>
      <p className="page-subtitle">Voici de quoi te remettre dans l'ambiance.</p>

      <div className="section">
        <h2 className="section-title">Écouté récemment</h2>
        {recent === null ? <SkeletonRows count={5} /> : <TrackList tracks={recent} />}
      </div>

      <div className="section">
        <h2 className="section-title">Tes titres du moment</h2>
        {top === null ? <SkeletonRows count={5} /> : <TrackList tracks={top} />}
      </div>
    </div>
  )
}
