import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { parseInvitePayload } from '@/split/api'

export function QrJoinScanner({ onCode }: { onCode: (code: string) => void }) {
  const reactId = useId().replace(/:/g, '')
  const hostId = `qr-join-${reactId}`
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode(hostId)
    let stopped = false

    void scanner
      .start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (stopped) return
          stopped = true
          onCodeRef.current(parseInvitePayload(decoded))
          void scanner.stop().catch(() => undefined)
        },
        () => undefined,
      )
      .catch(() => {
        setError('Camera is not available. Allow camera access, or type the invite code.')
      })

    return () => {
      stopped = true
      void scanner.stop().catch(() => undefined)
    }
  }, [hostId])

  return (
    <div>
      <div id={hostId} className="overflow-hidden rounded-2xl bg-slate-900" />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
