import { BookOpen, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMonthlyReviews, useTransactions } from '@/db/hooks'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { currentMonth, formatMonthTitle, previousMonth } from '@/utils/date'
import type { MonthlyReview, Transaction } from '@/types'

export function ReviewsPage() {
  const reviews = useMonthlyReviews()
  const transactions = useTransactions()

  if (!reviews || !transactions) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading reviews..."
        subtitle="Reading completed months on this device"
      />
    )
  }

  return <ReviewsHub reviews={reviews} transactions={transactions} />
}

function ReviewsHub({
  reviews,
  transactions,
}: {
  reviews: MonthlyReview[]
  transactions: Transaction[]
}) {
  const thisMonth = currentMonth()
  const lastMonth = previousMonth()
  const reviewed = new Set(reviews.map((review) => review.month))
  const lastHasActivity = transactions.some((transaction) =>
    transaction.date.startsWith(lastMonth),
  )
  const thisHasActivity = transactions.some((transaction) =>
    transaction.date.startsWith(thisMonth),
  )

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          to="/settings"
          aria-label="Back to settings"
          className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Monthly review
          </h1>
          <p className="text-sm text-slate-500">A short look back when a month ends</p>
        </div>
      </header>

      <div className="space-y-3">
        {lastHasActivity && !reviewed.has(lastMonth) ? (
          <Link
            to={`/review/${lastMonth}`}
            className="block rounded-2xl bg-blue-600 p-4 text-white"
          >
            <p className="text-sm text-blue-100">Ready</p>
            <p className="mt-1 font-semibold">{formatMonthTitle(lastMonth)}</p>
            <p className="mt-1 text-sm text-blue-100">Begin the review</p>
          </Link>
        ) : null}

        {thisHasActivity ? (
          <Link
            to={`/review/${thisMonth}`}
            className="block rounded-2xl border border-blue-100 bg-white p-4"
          >
            <p className="text-xs text-slate-400">This month</p>
            <p className="mt-1 font-medium text-slate-900">{formatMonthTitle(thisMonth)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {reviewed.has(thisMonth) ? 'Open again' : 'Review early'}
            </p>
          </Link>
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <ul className="divide-y divide-blue-50 overflow-hidden rounded-2xl border border-blue-100 bg-white">
          {reviews.map((review) => (
            <li key={review.month}>
              <Link
                to={`/review/${review.month}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{formatMonthTitle(review.month)}</p>
                  <p className="truncate text-xs text-slate-400">{review.note || 'No note'}</p>
                </div>
                <span className="text-xs font-medium text-blue-600">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No reviews yet"
          description="After a month ends, Home will offer a short walk through. You can also review this month early."
        />
      )}
    </section>
  )
}
