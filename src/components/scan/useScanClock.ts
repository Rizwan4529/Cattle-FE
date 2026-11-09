import { useEffect, useRef, useState } from 'react'

/**
 * The simulation clock: simulated milliseconds since Start, advanced each
 * animation frame at `speed`×. Long frames (a background tab) are capped so
 * the run never jumps ahead.
 */
export function useScanClock(length: number, speed: number) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const next = Math.min(length, elapsedRef.current + Math.min(100, now - last) * speed)
      last = now
      elapsedRef.current = next
      setElapsed(next)
      if (next >= length) setRunning(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, speed, length])

  const jump = (to: number) => {
    elapsedRef.current = to
    setElapsed(to)
  }

  const done = elapsed >= length
  return {
    elapsed,
    running,
    status: done ? 'done' : running ? 'running' : elapsed > 0 ? 'paused' : 'idle',
    start: () => !done && setRunning(true),
    pause: () => setRunning(false),
    reset: () => {
      setRunning(false)
      jump(0)
    },
    finish: () => {
      setRunning(false)
      jump(length)
    },
  } as const
}

export type ScanStatus = 'idle' | 'running' | 'paused' | 'done'
