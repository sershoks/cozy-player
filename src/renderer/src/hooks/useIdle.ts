import { useEffect, useRef, useState } from 'react'

export function useIdle(timeoutMs = 3000): boolean {
  const [idle, setIdle] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const reset = () => {
      setIdle(false)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setIdle(true), timeoutMs)
    }
    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    return () => {
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [timeoutMs])

  return idle
}
