import { Image, Repeat, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { formatDisplayDate } from '@/utils/date'
import { CategoryIcon } from '@/utils/categoryIcons'
import type { Category, Transaction } from '@/types'

export function TransactionItem({
  transaction,
  category,
  currency,
  onDelete,
  onOpen,
}: {
  transaction: Transaction
  category?: Category
  currency: string
  onDelete?: () => void
  onOpen?: () => void
}) {
  const isIncome = transaction.type === 'income'
  const color = category?.color ?? '#2563eb'
  const hasReceipt = Boolean(transaction.receiptPhoto)
  const categoryName = category?.name ?? 'Uncategorized'
  const amountLabel = `${isIncome ? '+' : '−'}${formatCurrency(transaction.amount, currency)}`
  const openLabel = `${categoryName}, ${isIncome ? 'income' : 'expense'} ${amountLabel}`

  const body = (
    <>
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <CategoryIcon name={category?.icon ?? 'CircleEllipsis'} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{categoryName}</p>
        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
          {transaction.isRecurring ? (
            <Repeat className="size-3 shrink-0 text-blue-500" aria-hidden />
          ) : null}
          {hasReceipt ? (
            <Image className="size-3 shrink-0 text-blue-500" aria-hidden />
          ) : null}
          <span className="truncate">
            {formatDisplayDate(transaction.date)}
            {transaction.note ? ` · ${transaction.note}` : ''}
          </span>
        </p>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold ${
          isIncome ? 'text-blue-700' : 'text-slate-900'
        }`}
      >
        {amountLabel}
      </p>
    </>
  )

  return (
    <article className="flex items-center gap-3 py-3">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={openLabel}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${categoryName} transaction`}
          onClick={onDelete}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      ) : null}
    </article>
  )
}
