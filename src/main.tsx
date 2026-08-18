import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { registerSW } from 'virtual:pwa-register'
import { db } from '@/db/db'
import { generateDueRecurringTransactions } from '@/db/recurring'
import { seedDatabase } from '@/db/seed'
import { useSettingsStore } from '@/stores/settingsStore'
import { Loader } from '@/components/ui/Loader'
import App from './App.tsx'
import './index.css'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <Loader
      className="min-h-dvh"
      title="Opening your finance tracker..."
      subtitle="Loading data stored on this device"
    />
  </StrictMode>,
)

async function bootstrap() {
  await db.open()
  await seedDatabase()
  await generateDueRecurringTransactions()
  await useSettingsStore.getState().hydrate()

  root.render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </StrictMode>,
  )
}

void bootstrap().catch((error: unknown) => {
  console.error(error)
  document.body.textContent = 'Failed to open the local database.'
})
