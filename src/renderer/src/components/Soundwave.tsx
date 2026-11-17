import { useEffect, useRef } from 'react'

interface Props {
  playing: boolean
  color: string // "r, g, b"
  bars?: number
}

// Stylised visualizer: audio is decoded by the go-librespot subprocess, so
// the renderer has no PCM to analyse — the bars are driven by per-bar sine
// waves whose energy eases up when playing and settles when paused.
export default function Soundwave({ playing, color, bars = 56 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playingRef = useRef(playing)
  const colorRef = useRef(color)
  playingRef.current = playing
  colorRef.current = color

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let energy = 0.15
    const start = performance.now()
    // Per-bar random phase/frequency so bars don't move in lockstep.
    const seeds = Array.from({ length: bars }, () => ({
      f1: 0.6 + Math.random() * 0.8,
      f2: 0.15 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2
    }))

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw(now: number) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const t = (now - start) / 1000

      const target = playingRef.current ? 1 : 0.12
      energy += (target - energy) * 0.04

      ctx!.clearRect(0, 0, w, h)

      // Layout may not be settled on the very first frames.
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(draw)
        return
      }

      const gap = 4
      const barWidth = Math.max(1, w / bars - gap)
      const midY = h / 2
      const [r, g, b] = colorRef.current.split(',').map((n) => n.trim())

      for (let i = 0; i < bars; i++) {
        const s = seeds[i]
        const wave = Math.sin(t * s.f1 + s.phase) * 0.5 + Math.sin(t * s.f2 + s.phase) * 0.5
        const norm = Math.max(0.06, (wave * 0.5 + 0.5) * energy)
        const barH = norm * h * 0.42
        const x = i * (barWidth + gap)
        const alpha = 0.35 + norm * 0.5

        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        const radius = Math.max(0, Math.min(3, barWidth / 2, barH))
        roundRect(ctx!, x, midY - barH, barWidth, barH * 2, radius)
        ctx!.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [bars])

  return <canvas ref={canvasRef} className="soundwave-canvas" />
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
