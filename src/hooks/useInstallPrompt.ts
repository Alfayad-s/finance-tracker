import { useCallback, useEffect, useState } from 'react'

const DISMISS_KEY = 'finance-tracker-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOs
}

export function useInstallPrompt() {
  const [installed, setInstalled] = useState(isStandaloneDisplay)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const ios = isIosDevice()

  useEffect(() => {
    const sync = () => setInstalled(isStandaloneDisplay())
    sync()
    const media = window.matchMedia('(display-mode: standalone)')
    media.addEventListener('change', sync)
    window.addEventListener('appinstalled', sync)
    return () => {
      media.removeEventListener('change', sync)
      window.removeEventListener('appinstalled', sync)
    }
  }, [])

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return false
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === 'accepted') {
      setInstalled(true)
      return true
    }
    return false
  }, [deferred])

  return {
    installed,
    ios,
    canPrompt: Boolean(deferred) && !installed,
    showBanner: !installed && !dismissed && (Boolean(deferred) || ios),
    showSettings: !installed,
    dismiss,
    install,
  }
}
