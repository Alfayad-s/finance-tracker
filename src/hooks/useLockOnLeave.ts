import { useEffect } from 'react'
import { useLockStore } from '@/stores/lockStore'

export function useLockOnLeave() {
  const lock = useLockStore((store) => store.lock)

  useEffect(() => {
    const hide = () => {
      if (useLockStore.getState().enabled) lock()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hide()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', hide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', hide)
    }
  }, [lock])
}
