import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/Button'
import { inviteJoinPath } from '@/split/api'

export function InviteQr({ code }: { code: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const link = `${window.location.origin}${inviteJoinPath(code)}`

  useEffect(() => {
    void QRCode.toDataURL(link, { margin: 1, width: 240, color: { dark: '#0f172a', light: '#ffffff' } }).then(
      setDataUrl,
    )
  }, [link])

  return (
    <div className="text-center">
      {dataUrl ? (
        <img src={dataUrl} alt="Invite QR code" className="mx-auto size-52 rounded-2xl border border-blue-100" />
      ) : (
        <p className="text-sm text-slate-500">Making QR code…</p>
      )}
      <p className="mt-3 text-sm font-medium tracking-widest text-slate-900">{code}</p>
      <p className="mt-1 break-all text-xs text-slate-400">{link}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          className="bg-slate-100 text-slate-700"
          onClick={() => void navigator.clipboard.writeText(code)}
        >
          Copy code
        </Button>
        <Button
          onClick={() => {
            if (navigator.share) {
              void navigator.share({ title: 'Join my split group', url: link, text: `Join with ${code}` })
              return
            }
            void navigator.clipboard.writeText(link)
          }}
        >
          Share link
        </Button>
      </div>
    </div>
  )
}
