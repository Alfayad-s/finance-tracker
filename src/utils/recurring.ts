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
