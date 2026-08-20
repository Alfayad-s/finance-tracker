let audio: HTMLAudioElement | null = null
let unlocked = false

function getAudio() {
  if (!audio) {
    audio = new Audio('/notification-sound.mp3')
    audio.preload = 'auto'
  }
  return audio
}

export function unlockNotificationSound() {
  if (unlocked) return
  const player = getAudio()
  player.volume = 0
  void player
    .play()
    .then(() => {
      player.pause()
      player.currentTime = 0
      player.volume = 1
      unlocked = true
    })
    .catch(() => {
      player.volume = 1
    })
}

export function playNotificationSound() {
  const player = getAudio()
  player.currentTime = 0
  player.volume = 1
  void player.play().catch(() => {
    /* browsers may block until a tap */
  })
}
