import { useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export function ReceiptViewer({
  src,
  onClose,
  onRemove,
}: {
  src: string
  onClose: () => void
  onRemove?: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, onClose, dialogRef)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-viewer-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 mx-auto flex max-w-lg flex-col bg-slate-950 outline-none"
    >
      <header className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <p id="receipt-viewer-title" className="text-sm font-medium text-white">
          Receipt
        </p>
        <button
          type="button"
          aria-label="Close receipt"
          onClick={onClose}
          className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <img src={src} alt="Receipt" className="max-h-full max-w-full object-contain" />
      </div>
      {onRemove ? (
        <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button className="w-full bg-white text-slate-900" onClick={onRemove}>
            Remove photo
          </Button>
        </div>
      ) : (
        <div className="pb-[env(safe-area-inset-bottom)]" />
      )}
    </div>
  )
}
