import { useId, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { fileToReceiptDataUrl } from '@/utils/receipt'

export function ReceiptPicker({
  value,
  onChange,
}: {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setReading(true)
    setError(null)
    try {
      onChange(await fileToReceiptDataUrl(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add that photo')
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        Receipt
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-blue-100">
          <img src={value} alt="Receipt" className="h-28 w-full object-cover" />
          <button
            type="button"
            aria-label="Remove receipt"
            onClick={() => {
              setError(null)
              onChange(undefined)
            }}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-slate-600 shadow-sm"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={reading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-slate-50 px-3 py-4 text-sm font-medium text-blue-700"
        >
          <ImagePlus className="size-4" aria-hidden />
          {reading ? 'Adding photo…' : 'Add a photo'}
        </button>
      )}
      <p className="text-xs text-slate-400">Stored on this device only. Optional.</p>
      {error ? (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
