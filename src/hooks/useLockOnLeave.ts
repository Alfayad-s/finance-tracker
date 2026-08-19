import { useEffect } from 'react'
import { useLockStore } from '@/stores/lockStore'

function isFileInput(target: EventTarget | null): target is HTMLInputElement {
  return target instanceof HTMLInputElement && target.type === 'file'
}

export function useLockOnLeave() {
  const lock = useLockStore((store) => store.lock)

  useEffect(() => {
    let left = false

    const armIfFileInput = (event: Event) => {
      if (isFileInput(event.target)) {
        useLockStore.getState().armSkipLock()
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        left = true
        return
      }

      const store = useLockStore.getState()
      if (store.skipLock) {
        store.clearSkipLock()
        left = false
        return
      }

      if (!left) return
      left = false
      if (store.enabled) lock()
    }

    const onFocus = () => {
      if (document.visibilityState !== 'visible') return
      if (left) return
      useLockStore.getState().clearSkipLock()
    }

    document.addEventListener('click', armIfFileInput, true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('click', armIfFileInput, true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [lock])
}
