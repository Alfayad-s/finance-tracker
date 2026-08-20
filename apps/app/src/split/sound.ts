import soundFile from '@/assets/notification-sound.mp3?url'

const PREF_KEY = 'split-sound-alerts'

type SoundPref = 'on' | 'off' | null

let primed: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null

function makePlayer() {
  const player = new Audio(soundFile)
  player.preload = 'auto'
  player.setAttribute('playsinline', 'true')
  player.volume = 1
  player.muted = false
  return player
}

export function getSoundPref(): SoundPref {
  try {
    const value = localStorage.getItem(PREF_KEY)
    if (value === 'on' || value === 'off') return value
  } catch {
    /* ignore */
  }
  return null
}

export function isSoundEnabled() {
  return getSoundPref() === 'on'
}

export function setSoundPref(value: 'on' | 'off') {
  try {
    localStorage.setItem(PREF_KEY, value)
  } catch {
    /* ignore */
  }
}

function resumeContextFromGesture() {
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  if (!audioContext) audioContext = new Ctx()
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

export function enableSoundFromUserGesture() {
  setSoundPref('on')
  resumeContextFromGesture()
  if (!primed) primed = makePlayer()
  primed.currentTime = 0
  primed.muted = false
  primed.volume = 1
  void primed.play().catch(() => {
    primed = makePlayer()
    void primed.play().catch(() => undefined)
  })
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}

export function declineSoundAlerts() {
  setSoundPref('off')
}

export function playNotificationSound() {
  if (!isSoundEnabled()) return
  if (audioContext?.state === 'suspended') {
    void audioContext.resume()
  }
  const player = primed ?? makePlayer()
  primed = player
  player.pause()
  player.currentTime = 0
  player.muted = false
  player.volume = 1
  const attempt = player.play()
  if (attempt) {
    void attempt.catch(() => {
      const retry = makePlayer()
      primed = retry
      void retry.play().catch(() => undefined)
    })
  }
}
