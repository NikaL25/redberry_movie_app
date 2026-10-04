import { useEffect, useState } from 'react'

export function useHoldTimer(expiresAt: string | null, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!expiresAt) {
      setSeconds(0)
      return
    }
    let expired = false
    const tick = () => {
      const remaining = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining === 0 && !expired) {
        expired = true
        onExpire?.()
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiresAt, onExpire])

  return seconds
}
