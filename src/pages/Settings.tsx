import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resetAppData } from '@/db/backup'
import { useSettings } from '@/db/hooks'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePrivacyStore } from '@/stores/privacyStore'
import { Loader } from '@/components/ui/Loader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { InstallSettingsRow } from '@/components/InstallApp'
import { PinLockSettings } from '@/components/PinLockSettings'
import { ProfileEditor } from '@/components/ProfileEditor'
import { isAvatarId } from '@/components/avatars'
import { cn } from '@/lib/utils'
import { CURRENCIES } from '@/utils/currency'
import type { FirstDayOfWeek } from '@/types'

export function SettingsPage() {
  const settings = useSettings()
  const updateSettings = useSettingsStore((store) => store.updateSettings)
  const hydrate = useSettingsStore((store) => store.hydrate)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  if (!settings) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading settings..."
        subtitle="Reading preferences on this device"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything stays on this device. No account, no cloud.
        </p>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        <p className="mt-1 mb-5 text-sm text-slate-500">Name and avatar stay on this device</p>
        <ProfileEditor
          name={settings.displayName}
          avatarId={isAvatarId(settings.avatarId) ? settings.avatarId : 1}
          onSave={(data) => updateSettings(data)}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <h2 className="px-4 pt-4 text-sm font-semibold text-slate-900">Preferences</h2>
        <label className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm text-slate-700">Currency</span>
          <select
            value={settings.currency}
            onChange={(event) => {
              void updateSettings({ currency: event.target.value })
            }}
            className="max-w-[60%] rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} · {currency.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-4 border-t border-blue-50 px-4 py-3">
          <span className="text-sm text-slate-700">Week starts</span>
          <select
            value={settings.firstDayOfWeek}
            onChange={(event) => {
              void updateSettings({
                firstDayOfWeek: Number(event.target.value) as FirstDayOfWeek,
              })
            }}
            className="rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </label>
        <div className="flex items-center justify-between gap-4 border-t border-blue-50 px-4 py-3">
          <div className="min-w-0">
            <p id="soft-insights-label" className="text-sm text-slate-700">
              Soft insights
            </p>
            <p className="text-xs text-slate-400">Gentle notes on Home when spending looks notable</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.softInsightsEnabled}
            aria-labelledby="soft-insights-label"
            onClick={() => {
              void updateSettings({
                softInsightsEnabled: !settings.softInsightsEnabled,
              })
            }}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              settings.softInsightsEnabled ? 'bg-blue-600' : 'bg-slate-200',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-[left,right]',
                settings.softInsightsEnabled ? 'right-0.5 left-auto' : 'left-0.5 right-auto',
              )}
            />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-blue-50 px-4 py-3">
          <div className="min-w-0">
            <p id="hide-amounts-label" className="text-sm text-slate-700">
              Hide amounts
            </p>
            <p className="text-xs text-slate-400">
              Cover balances and totals. Tap the card or the eye to peek.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(settings.hideAmounts)}
            aria-labelledby="hide-amounts-label"
            onClick={() => {
              const next = !settings.hideAmounts
              usePrivacyStore.getState().hidePeek()
              void updateSettings({ hideAmounts: next })
            }}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              settings.hideAmounts ? 'bg-blue-600' : 'bg-slate-200',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-[left,right]',
                settings.hideAmounts ? 'right-0.5 left-auto' : 'left-0.5 right-auto',
              )}
            />
          </button>
        </div>
      </section>

      <PinLockSettings />

      <InstallSettingsRow />

      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <h2 className="px-4 pt-4 text-sm font-semibold text-slate-900">Data</h2>
        <Link
          to="/settings/categories"
          className="flex items-center justify-between px-4 py-3 text-sm text-slate-700"
        >
          Categories
          <ChevronRight className="size-4 text-slate-400" aria-hidden />
        </Link>
        <Link
          to="/settings/recurring"
          className="flex items-center justify-between border-t border-blue-50 px-4 py-3 text-sm text-slate-700"
        >
          Recurring
          <ChevronRight className="size-4 text-slate-400" aria-hidden />
        </Link>
        <Link
          to="/settings/review"
          className="flex items-center justify-between border-t border-blue-50 px-4 py-3 text-sm text-slate-700"
        >
          Monthly review
          <ChevronRight className="size-4 text-slate-400" aria-hidden />
        </Link>
        <Link
          to="/settings/backup"
          className="flex items-center justify-between border-t border-blue-50 px-4 py-3 text-sm text-slate-700"
        >
          Export & import
          <ChevronRight className="size-4 text-slate-400" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Reset</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Delete every transaction, budget, goal, receipt, and setting on this
          device. Built-in categories come back. This cannot be undone.
        </p>
        <Button
          className="mt-4 w-full bg-red-600"
          onClick={() => {
            setResetError(null)
            setConfirmReset(true)
          }}
        >
          Reset app
        </Button>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Privacy</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Finance Tracker never sends your money data anywhere. Transactions,
          categories, and settings live in this browser only. There is no login
          and no analytics. An optional PIN or device unlock (Face ID / fingerprint)
          only hides the screen on this device; it does not encrypt your data.
        </p>
        <p className="mt-3 text-xs text-slate-400">Version 0.1.0</p>
      </section>

      {confirmReset ? (
        <ConfirmDialog
          title="Reset this app?"
          description="All money data on this device will be deleted. Export a backup first if you might want it later."
          confirmLabel="Reset everything"
          busyLabel="Resetting…"
          busy={resetting}
          danger
          error={resetError}
          onCancel={() => {
            if (!resetting) setConfirmReset(false)
          }}
          onConfirm={() => {
            void (async () => {
              setResetting(true)
              setResetError(null)
              try {
                await resetAppData()
                await hydrate()
                setConfirmReset(false)
              } catch (caught) {
                setResetError(
                  caught instanceof Error ? caught.message : 'Could not reset this app',
                )
              } finally {
                setResetting(false)
              }
            })()
          }}
        />
      ) : null}
    </section>
  )
}
