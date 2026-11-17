import { useCallback, useEffect, useState } from 'react'

export function useSavedTracks(uris: string[]) {
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const key = uris.join(',')

  useEffect(() => {
    if (uris.length === 0) return
    let cancelled = false
    window.cozy.spotify
      .checkSaved(uris)
      .then((results) => {
        if (cancelled) return
        setSaved(new Set(uris.filter((_, i) => results[i])))
      })
      .catch(() => {
        // leave saved state as-is — the heart just won't reflect reality yet
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const toggle = useCallback(
    (uri: string) => {
      const wasSaved = saved.has(uri)
      setSaved((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.delete(uri)
        else next.add(uri)
        return next
      })
      const request = wasSaved ? window.cozy.spotify.removeSavedTrack(uri) : window.cozy.spotify.saveTrack(uri)
      request.catch(() => {
        // revert the optimistic flip if the API call failed
        setSaved((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.add(uri)
          else next.delete(uri)
          return next
        })
      })
    },
    [saved]
  )

  return { isSaved: (uri: string) => saved.has(uri), toggle }
}
