import { addMonths, format, formatISO, isToday, isYesterday, parseISO, startOfMonth, subMonths } from 'date-fns'

export function todayISO(): string {
  return formatISO(new Date(), { representation: 'date' })
}

export function currentMonth(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM')
}

export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMM yyyy')
}

export function formatGroupDate(isoDate: string): string {
  const date = parseISO(isoDate)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEE, d MMM yyyy')
}

export function previousMonth(): string {
  return format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM')
}

export function formatMonthTitle(yearMonth: string): string {
  return format(parseISO(`${yearMonth}-01`), 'MMMM yyyy')
}

export function shiftMonth(yearMonth: string, delta: number): string {
  return format(addMonths(parseISO(`${yearMonth}-01`), delta), 'yyyy-MM')
}

export function lastNMonths(count: number, from = currentMonth()): string[] {
  return Array.from({ length: count }, (_, index) => shiftMonth(from, index - (count - 1)))
}

export function formatMonthShort(yearMonth: string): string {
  return format(parseISO(`${yearMonth}-01`), 'MMM')
}
