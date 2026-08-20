import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { setReceiptPhoto } from '@/db/hooks'
import { ReceiptPicker } from '@/components/ReceiptPicker'
import { ReceiptViewer } from '@/components/ReceiptViewer'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { CategoryIcon } from '@/utils/categoryIcons'
import { Amount } from '@/components/Amount'
import { formatDisplayDate } from '@/utils/date'
import type { Category, Transaction } from '@/types'

export function TransactionDetail({
  transaction,
  category,
  currency,
  onClose,
}: {
  transaction: Transaction
  category?: Category
  currency: string
  onClose: () => void
}) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const dialogRef = useRef<HTMLElement | null>(null)
  const color = category?.color ?? '#2563eb'
  const isIncome = transaction.type === 'income'

  useFocusTrap(!viewerOpen, onClose, dialogRef)

  return (
    <>
      <div className="fixed inset-0 z-40 mx-auto max-w-lg">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-slate-900/40"
          onClick={onClose}
        />
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-detail-title"
          tabIndex={-1}
          className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
        >
          <header className="mb-4 flex items-center justify-between">
            <h2 id="transaction-detail-title" className="text-lg font-semibold text-slate-900">
              {category?.name ?? 'Uncategorized'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div className="flex items-center gap-3">
            <span
              className="flex size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <CategoryIcon name={category?.icon ?? 'CircleEllipsis'} className="size-5" aria-hidden />
            </span>
            <div>
              <p
                className={`text-2xl font-semibold tracking-tight ${
                  isIncome ? 'text-blue-700' : 'text-slate-900'
                }`}
              >
                {isIncome ? (
                  <Amount value={transaction.amount} currency={currency} sign="in" />
                ) : (
                  <Amount value={transaction.amount} currency={currency} sign="out" />
                )}
              </p>
              <p className="text-sm text-slate-500">{formatDisplayDate(transaction.date)}</p>
            </div>
          </div>

          {transaction.note ? (
            <p className="mt-4 text-sm text-slate-600">{transaction.note}</p>
          ) : null}

          <div className="mt-5">
            {transaction.receiptPhoto ? (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="block w-full overflow-hidden rounded-2xl border border-blue-100"
              >
                <img
                  src={transaction.receiptPhoto}
                  alt="Receipt"
                  className="h-40 w-full object-cover"
                />
                <span className="block bg-slate-50 px-3 py-2 text-sm font-medium text-blue-700">
                  View full size
                </span>
              </button>
            ) : (
              <ReceiptPicker
                onChange={(photo) => {
                  void setReceiptPhoto(transaction.id, photo)
                }}
              />
            )}
          </div>
        </section>
      </div>

      {viewerOpen && transaction.receiptPhoto ? (
        <ReceiptViewer
          src={transaction.receiptPhoto}
          onClose={() => setViewerOpen(false)}
          onRemove={() => {
            void setReceiptPhoto(transaction.id, undefined)
            setViewerOpen(false)
          }}
        />
      ) : null}
    </>
  )
}
