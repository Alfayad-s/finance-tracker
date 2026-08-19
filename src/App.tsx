import { Route, Routes } from 'react-router-dom'
import { DocumentTitle } from '@/components/DocumentTitle'
import { AppLayout } from '@/components/layout/AppLayout'
import { Budgets } from '@/pages/Budgets'
import { Goals } from '@/pages/Goals'
import { Home } from '@/pages/Home'
import { SettingsPage } from '@/pages/Settings'
import { CategoriesPage } from '@/pages/Categories'
import { RecurringPage } from '@/pages/Recurring'
import { ReviewsPage } from '@/pages/Reviews'
import { ReviewShell } from '@/pages/MonthlyReview'
import { BackupPage } from '@/pages/Backup'
import { CsvImportPage } from '@/pages/CsvImport'
import { Transactions } from '@/pages/Transactions'

export default function App() {
  return (
    <>
      <DocumentTitle />
      <Routes>
      <Route path="/review/:month" element={<ReviewShell />} />
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
