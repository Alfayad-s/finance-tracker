import { useId, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  busyLabel,
  busy = false,
  error,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  busyLabel?: string
  busy?: boolean
  error?: string | null
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  useFocusTrap(true, busy ? () => undefined : onCancel, ref)

  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-lg items-end bg-slate-900/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="w-full rounded-3xl bg-white p-5 shadow-2xl outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p id={descId} className="mt-1 text-sm text-slate-500">
          {description}
        </p>
        {error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button className="bg-slate-100 text-slate-700" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            className={danger ? 'bg-red-600' : undefined}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (busyLabel ?? 'Working…') : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
