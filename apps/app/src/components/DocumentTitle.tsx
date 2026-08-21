import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function titleFor(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname.startsWith('/transactions')) return 'Activity'
  if (pathname.startsWith('/budgets')) return 'Budgets'
  if (pathname.startsWith('/goals')) return 'Goals'
  if (pathname.startsWith('/review/')) return 'Monthly review'
  if (pathname.startsWith('/settings/profile')) return 'Profile'
  if (pathname.startsWith('/accounts/')) return 'Account'
  if (pathname.startsWith('/settings/accounts')) return 'Accounts'
  if (pathname.startsWith('/settings/categories')) return 'Categories'
  if (pathname.startsWith('/settings/recurring') || pathname.startsWith('/settings/subscriptions'))
    return 'Subscriptions'
  if (pathname.startsWith('/settings/review')) return 'Monthly review'
  if (pathname.startsWith('/settings/backup')) return 'Export & import'
  if (pathname.startsWith('/settings/import')) return 'Bank statement import'
  if (pathname.startsWith('/splits')) return 'Splits'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Finance Tracker'
}

export function DocumentTitle() {
  const location = useLocation()

  useEffect(() => {
    const page = titleFor(location.pathname)
    document.title = page === 'Finance Tracker' ? page : `${page} · Finance Tracker`
  }, [location.pathname])

  return null
}
