import { addMonths, addWeeks, addYears, formatISO, parseISO } from 'date-fns'
import type { RecurringFrequency } from '@/types'

export const RECURRING_FREQUENCIES: RecurringFrequency[] = ['weekly', 'monthly', 'yearly']

export function nextOccurrence(isoDate: string, frequency: RecurringFrequency): string {
  const date = parseISO(isoDate)
  const next =
    frequency === 'weekly'
      ? addWeeks(date, 1)
      : frequency === 'yearly'
        ? addYears(date, 1)
        : addMonths(date, 1)
  return formatISO(next, { representation: 'date' })
}

export function frequencyLabel(frequency: RecurringFrequency): string {
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'yearly') return 'Yearly'
  return 'Monthly'
}

/** Typical amount that leaves (or arrives) in a calendar month. */
export function monthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
  if (frequency === 'weekly') return Math.round(((amount * 52) / 12) * 100) / 100
  if (frequency === 'yearly') return Math.round((amount / 12) * 100) / 100
  return amount
}

export function recurringTitle(note: string | undefined, categoryName?: string): string {
  const trimmed = note?.trim()
  if (trimmed) return trimmed
  return categoryName || 'Subscription'
}
