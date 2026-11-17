import { useEffect, useState } from 'react'
import type { SpotifyTrack } from '../../../shared/types'
import TrackList from '../components/TrackList'
import { SkeletonRows } from '../components/Skeleton'

export default function Library() {
  const [saved, setSaved] = useState<SpotifyTrack[] | null>(null)

  useEffect(() => {
    window.cozy.spotify.savedTracks().then(setSaved).catch(() => setSaved([]))
  }, [])

  return (
    <div>
      <h1 className="page-title">Bibliothèque</h1>
      <p className="page-subtitle">Tes titres likés.</p>
      {saved === null ? <SkeletonRows count={8} /> : <TrackList tracks={saved} />}
    </div>
  )
}
