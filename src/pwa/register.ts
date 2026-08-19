import { registerSW } from 'virtual:pwa-register'

type UpdateSW = (reloadPage?: boolean) => Promise<void>

let updateSW: UpdateSW | undefined
let needRefresh = false
const listeners = new Set<(value: boolean) => void>()

function notify() {
  for (const listener of listeners) listener(needRefresh)
}

export function initPwa() {
  if (!import.meta.env.PROD) return
  if (updateSW) return

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true
      notify()
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return

      const check = () => {
        void registration.update()
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.setInterval(check, 60 * 60 * 1000)
    },
  })
}

export function subscribePwaUpdate(listener: (value: boolean) => void) {
  listeners.add(listener)
  listener(needRefresh)
  return () => {
    listeners.delete(listener)
  }
}

export function applyPwaUpdate() {
  return updateSW?.(true)
}
