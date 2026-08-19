import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DocumentTitle } from '@/components/DocumentTitle'
import { LockScreen } from '@/components/LockScreen'
import { UpdateBanner } from '@/components/UpdateBanner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Home } from '@/pages/Home'
import { Loader } from '@/components/ui/Loader'
import { useHidePeekOnLeave } from '@/hooks/useAmountPrivacy'
import { useLockOnLeave } from '@/hooks/useLockOnLeave'
import { useLockStore } from '@/stores/lockStore'

const Transactions = lazy(async () => {
  const module = await import('@/pages/Transactions')
  return { default: module.Transactions }
})
const Budgets = lazy(async () => {
  const module = await import('@/pages/Budgets')
  return { default: module.Budgets }
})
const Goals = lazy(async () => {
  const module = await import('@/pages/Goals')
  return { default: module.Goals }
})
const SettingsPage = lazy(async () => {
  const module = await import('@/pages/Settings')
  return { default: module.SettingsPage }
})
const CategoriesPage = lazy(async () => {
  const module = await import('@/pages/Categories')
  return { default: module.CategoriesPage }
})
const RecurringPage = lazy(async () => {
  const module = await import('@/pages/Recurring')
  return { default: module.RecurringPage }
})
const ReviewsPage = lazy(async () => {
  const module = await import('@/pages/Reviews')
  return { default: module.ReviewsPage }
})
const ReviewShell = lazy(async () => {
  const module = await import('@/pages/MonthlyReview')
  return { default: module.ReviewShell }
})
const BackupPage = lazy(async () => {
  const module = await import('@/pages/Backup')
  return { default: module.BackupPage }
})
const CsvImportPage = lazy(async () => {
  const module = await import('@/pages/CsvImport')
  return { default: module.CsvImportPage }
})

function PageFallback() {
  return (
    <Loader
      size="sm"
      className="min-h-[50dvh] gap-4 p-4"
      title="Loading..."
      subtitle="Opening this screen"
    />
  )
}

export default function App() {
  useLockOnLeave()
  useHidePeekOnLeave()
  const locked = useLockStore((store) => store.enabled && !store.unlocked)

  if (locked) {
    return (
      <>
        <DocumentTitle />
        <LockScreen />
      </>
    )
  }

  return (
    <>
      <DocumentTitle />
      <UpdateBanner />
      <Routes>
        <Route
          path="/review/:month"
          element={
            <Suspense fallback={<PageFallback />}>
              <ReviewShell />
            </Suspense>
          }
        />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/categories" element={<CategoriesPage />} />
          <Route path="/settings/recurring" element={<RecurringPage />} />
          <Route path="/settings/review" element={<ReviewsPage />} />
          <Route path="/settings/backup" element={<BackupPage />} />
          <Route path="/settings/import" element={<CsvImportPage />} />
        </Route>
      </Routes>
    </>
  )
}
