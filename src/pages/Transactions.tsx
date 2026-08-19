import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Wallet, X } from 'lucide-react'
import {
  deleteTransaction,
  useCategories,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { Loader } from '@/components/ui/Loader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BackButton } from '@/components/ui/BackButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TransactionDetail } from '@/components/TransactionDetail'
import { TransactionItem } from '@/components/TransactionItem'
import { Amount, AmountPrivacyButton } from '@/components/Amount'
import { cn } from '@/lib/utils'
import { currentMonth, formatGroupDate, formatMonthTitle, previousMonth } from '@/utils/date'
import {
  filterTransactions,
  groupTransactionsByDate,
  type TransactionTypeFilter,
} from '@/utils/transactions'

const TYPE_FILTERS: { id: TransactionTypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
]

export function Transactions() {
  const transactions = useTransactions()
  const categories = useCategories()
  const settings = useSettings()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TransactionTypeFilter>('all')
  const [categoryId, setCategoryId] = useState('all')
  const [month, setMonth] = useState('all')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const thisMonth = currentMonth()
  const lastMonth = previousMonth()
  const categoryOptions = (categories ?? []).filter(
    (category) => type === 'all' || category.type === type || category.type === 'both',
  )
  const effectiveCategoryId = categoryOptions.some((category) => category.id === categoryId)
    ? categoryId
    : 'all'

  const filtered = useMemo(() => {
    if (!transactions || !categories) return []
    return filterTransactions(transactions, categories, {
      query,
      type,
      categoryId: effectiveCategoryId,
      month,
    })
  }, [transactions, categories, query, type, effectiveCategoryId, month])

  const groups = useMemo(() => groupTransactionsByDate(filtered), [filtered])
  const incomeTotal = filtered
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const expenseTotal = filtered
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const hasActiveFilters =
    query.trim() !== '' || type !== 'all' || effectiveCategoryId !== 'all' || month !== 'all'

  async function confirmDelete() {
    if (!pendingDeleteId) return
    setDeleting(true)
    try {
      await deleteTransaction(pendingDeleteId)
      setPendingDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  if (!transactions || !categories || !settings) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading transactions..."
        subtitle="Reading activity stored on this device"
      />
    )
  }

  const currency = settings.currency
  const selected = selectedId
    ? transactions.find((transaction) => transaction.id === selectedId)
    : undefined

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <BackButton to="/" label="Back to home" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Transactions
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        <AmountPrivacyButton />
      </header>

      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes, categories, amounts"
          className="w-full rounded-2xl border border-blue-100 bg-slate-50 py-2.5 pr-10 pl-10 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </label>

      <div className="flex gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setType(filter.id)}
            aria-pressed={type === filter.id}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium',
              type === filter.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 text-slate-500',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="sr-only">Month</span>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none"
          >
            <option value="all">All time</option>
            <option value={thisMonth}>This month · {formatMonthTitle(thisMonth)}</option>
            <option value={lastMonth}>Last month · {formatMonthTitle(lastMonth)}</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Category</span>
          <select
            value={effectiveCategoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none"
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {type === 'all' && category.type !== 'both'
                  ? `${category.name} · ${category.type}`
                  : category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-white p-3 text-sm">
          <div>
            <p className="text-slate-500">In</p>
            <p className="font-semibold text-blue-700">
              <Amount value={incomeTotal} currency={currency} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Out</p>
            <p className="font-semibold text-slate-900">
              <Amount value={expenseTotal} currency={currency} />
            </p>
          </div>
        </div>
      ) : null}

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No activity yet"
          description="Tap + to add your first income or expense. It stays on this device."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="Nothing matches"
          description="Try a different month, category, or search."
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={
            hasActiveFilters
              ? () => {
                  setQuery('')
                  setType('all')
                  setCategoryId('all')
                  setMonth('all')
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {formatGroupDate(group.date)}
              </h2>
              <ul className="divide-y divide-blue-50">
                {group.items.map((transaction) => (
                  <li key={transaction.id}>
                    <TransactionItem
                      transaction={transaction}
                      category={categories.find(
                        (category) => category.id === transaction.categoryId,
                      )}
                      currency={currency}
                      onOpen={() => setSelectedId(transaction.id)}
                      onDelete={() => setPendingDeleteId(transaction.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selected ? (
        <TransactionDetail
          transaction={selected}
          category={categories.find((category) => category.id === selected.categoryId)}
          currency={currency}
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {pendingDeleteId ? (
        <ConfirmDialog
          title="Delete transaction?"
          description="This stays on this device only. You can’t undo it."
          confirmLabel="Delete"
          busyLabel="Deleting…"
          busy={deleting}
          danger
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </section>
  )
}
