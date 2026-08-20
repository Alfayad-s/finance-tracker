import { useEffect, useRef, useState } from 'react'
import { parseInvitePayload } from '@/split/api'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

export function QrJoinScanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    const readFrame = async (
      detector: BarcodeDetectorLike | null,
      decodeJsQr: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null,
    ) => {
      if (stopped || !context) return
      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        try {
          if (detector) {
            const codes = await detector.detect(canvas)
            const value = codes[0]?.rawValue
            if (value) {
              stopped = true
              onCodeRef.current(parseInvitePayload(value))
              return
            }
          } else if (decodeJsQr) {
            const image = context.getImageData(0, 0, canvas.width, canvas.height)
            const result = decodeJsQr(image.data, image.width, image.height)
            if (result?.data) {
              stopped = true
              onCodeRef.current(parseInvitePayload(result.data))
              return
            }
          }
        } catch {
          /* keep scanning */
        }
      }
      raf = window.requestAnimationFrame(() => {
        void readFrame(detector, decodeJsQr)
      })
    }

    const start = async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 200))
      if (stopped) return
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        await video.play()

        const Detector = (
          window as Window & {
            BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike
          }
        ).BarcodeDetector
        const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null
        let decodeJsQr: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null =
          null
        if (!detector) {
          const module = await import('jsqr')
          decodeJsQr = module.default
        }
        void readFrame(detector, decodeJsQr)
      } catch {
        if (!stopped) {
          setError('Camera is not available. Allow camera access, or type the invite code.')
        }
      }
    }

    void start()

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
      stream?.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  }, [])

  return (
    <div>
      <video
        ref={videoRef}
        className="aspect-square min-h-56 w-full rounded-2xl bg-slate-900 object-cover"
        muted
        playsInline
        autoPlay
      />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : (
        <p className="mt-3 text-center text-sm text-slate-500">Align the QR inside the square</p>
      )}
    </div>
  )
}
