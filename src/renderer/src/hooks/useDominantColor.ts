import { useEffect, useState } from 'react'

export interface Palette {
  glow1: string
  glow2: string
  glow3: string
}

const DEFAULT_PALETTE: Palette = { glow1: '232, 163, 85', glow2: '201, 110, 90', glow3: '90, 70, 110' }
const cache = new Map<string, Palette>()

function extractPalette(img: HTMLImageElement): Palette {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return DEFAULT_PALETTE
  ctx.drawImage(img, 0, 0, size, size)

  const { data } = ctx.getImageData(0, 0, size, size)
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a < 200) continue

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const lightness = (max + min) / 2
    const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255))
    // Skip near-black/near-white/washed-out pixels so the palette stays vivid.
    if (lightness < 22 || lightness > 235 || saturation < 0.12) continue

    const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.count++
      bucket.r += r
      bucket.g += g
      bucket.b += b
    } else {
      buckets.set(key, { count: 1, r, g, b })
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)
  const colors = sorted
    .slice(0, 3)
    .map((b) => `${Math.round(b.r / b.count)}, ${Math.round(b.g / b.count)}, ${Math.round(b.b / b.count)}`)

  if (colors.length === 0) return DEFAULT_PALETTE
  return {
    glow1: colors[0],
    glow2: colors[1] ?? colors[0],
    glow3: colors[2] ?? colors[0]
  }
}

export function useDominantColor(imageUrl: string | null | undefined): Palette {
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE)

  useEffect(() => {
    if (!imageUrl) {
      setPalette(DEFAULT_PALETTE)
      return
    }

    const cached = cache.get(imageUrl)
    if (cached) {
      setPalette(cached)
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      try {
        const p = extractPalette(img)
        cache.set(imageUrl, p)
        setPalette(p)
      } catch {
        setPalette(DEFAULT_PALETTE)
      }
    }
    img.onerror = () => {
      if (!cancelled) setPalette(DEFAULT_PALETTE)
    }
    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return palette
}
