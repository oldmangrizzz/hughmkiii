import { useEffect, useRef } from 'react'

/**
 * useWakeLock: Keeps the screen alive during active operations.
 *
 * Primary: Screen Wake Lock API (modern browsers).
 * The DOM-level fallback (silent video loop) lives in OmniCanvas.tsx.
 * iOS releases the lock on tab-hide; we re-acquire on visibility restore.
 */
export function useWakeLock() {
  const sentinel = useRef<WakeLockSentinel | null>(null)

  const acquire = async () => {
    if (!('wakeLock' in navigator)) return
    try {
      sentinel.current = await navigator.wakeLock.request('screen')
      console.log('🔆 Wake lock acquired.')
      sentinel.current.addEventListener('release', () => {
        console.log('🔅 Wake lock released.')
      })
    } catch (err) {
      console.warn('⚠️ Wake lock denied — relying on video fallback.', err)
    }
  }

  useEffect(() => {
    acquire()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') acquire()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      sentinel.current?.release()
    }
  }, [])
}
