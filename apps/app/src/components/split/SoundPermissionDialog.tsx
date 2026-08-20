import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { declineSoundAlerts, enableSoundFromUserGesture, getSoundPref } from '@/split/sound'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function SoundPermissionDialog() {
  const { pathname } = useLocation()
  const onSplits = pathname.startsWith('/splits')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!onSplits) return
    if (getSoundPref() !== null) return
    setOpen(true)
  }, [onSplits])

  if (!open) return null

  return (
    <ConfirmDialog
      title="Turn on split alert sounds?"
      description="The first time you use splits, this app needs your OK to play a sound when someone joins, adds a bill, or pings you. Allow now so alerts work even when you are on another screen."
      confirmLabel="Allow sound"
      cancelLabel="Not now"
      onCancel={() => {
        declineSoundAlerts()
        setOpen(false)
      }}
      onConfirm={() => {
        enableSoundFromUserGesture()
        setOpen(false)
      }}
    />
  )
}
