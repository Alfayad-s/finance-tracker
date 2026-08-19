import { useEffect } from 'react'
import { useLockStore } from '@/stores/lockStore'

export function useLockOnLeave() {
  const lock = useLockStore((store) => store.lock)

  useEffect(() => {
    let left = false
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        left = true
        return
      }
      if (!left) return
      left = false
      if (useLockStore.getState().enabled) lock()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [lock])
}
