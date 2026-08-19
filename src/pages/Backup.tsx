import { useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { readBackup, restoreBackup } from '@/db/backup'
import { useCategories, useTransactions } from '@/db/hooks'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loader } from '@/components/ui/Loader'
import {
  downloadBlob,
  parseBackup,
  transactionsToCsv,
} from '@/utils/backup'
import { todayISO } from '@/utils/date'

export function BackupPage() {
  const transactions = useTransactions()
  const categories = useCategories()
  const hydrate = useSettingsStore((store) => store.hydrate)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'json' | 'csv' | 'import' | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!transactions || !categories) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading data..."
        subtitle="Reading everything stored on this device"
      />
    )
  }

  const allTransactions = transactions
  const allCategories = categories

  async function exportJson() {
    setBusy('json')
    setError(null)
    setMessage(null)
    try {
      const backup = await readBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      })
      downloadBlob(`finance-tracker-${todayISO()}.json`, blob)
      setMessage('JSON backup saved to your downloads')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not export JSON')
    } finally {
      setBusy(null)
    }
  }

  async function exportCsv() {
    setBusy('csv')
    setError(null)
    setMessage(null)
    try {
      const csv = transactionsToCsv(allTransactions, allCategories)
      const blob = new Blob([`\uFEFF${csv}\n`], { type: 'text/csv;charset=utf-8' })
      downloadBlob(`finance-tracker-${todayISO()}.csv`, blob)
      setMessage('CSV saved to your downloads')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not export CSV')
    } finally {
      setBusy(null)
    }
  }

  async function confirmImport() {
    if (!pendingFile) return
    setBusy('import')
    setError(null)
    setMessage(null)
    try {
      const text = await pendingFile.text()
      const backup = parseBackup(text)
      await restoreBackup(backup)
      await hydrate()
      setMessage(
        `Restored ${backup.transactions.length} transactions and ${backup.categories.length} categories`,
      )
      setPendingFile(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not import that file')
      setPendingFile(null)
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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
            Export & import
          </h1>
          <p className="text-sm text-slate-500">Files stay on this device unless you share them</p>
        </div>
      </header>

      <section className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Export</h2>
        <p className="text-sm leading-relaxed text-slate-500">
          JSON is a full backup. CSV is transactions only, for a spreadsheet.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={busy !== null} onClick={() => void exportJson()}>
            {busy === 'json' ? 'Exporting…' : 'JSON backup'}
          </Button>
          <Button
            className="bg-slate-100 text-slate-700"
            disabled={busy !== null || allTransactions.length === 0}
            onClick={() => void exportCsv()}
          >
            {busy === 'csv' ? 'Exporting…' : 'CSV'}
          </Button>
        </div>
        {allTransactions.length === 0 ? (
          <p className="text-xs text-slate-400">CSV appears after you add a transaction.</p>
        ) : (
          <p className="text-xs text-slate-400">
            {allTransactions.length} {allTransactions.length === 1 ? 'transaction' : 'transactions'} on
            this device
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Bank statement CSV</h2>
        <p className="text-sm leading-relaxed text-slate-500">
          Add transactions from HDFC, SBI, ICICI, Axis, Kotak, or a generic CSV. You preview
          rows first. This does not replace existing data.
        </p>
        <Link
          to="/settings/import"
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
        >
          Import bank CSV
        </Link>
      </section>

      <section className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Restore JSON</h2>
        <p className="text-sm leading-relaxed text-slate-500">
          Restore a JSON backup. This replaces everything currently stored in this browser.
        </p>
        <input
          id="backup-import-file"
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="JSON backup file"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setError(null)
            setMessage(null)
            setPendingFile(file)
          }}
        />
        <Button
          className="w-full"
          disabled={busy !== null}
          onClick={() => fileRef.current?.click()}
        >
          Choose JSON file
        </Button>
      </section>

      {message ? (
        <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <p className="text-xs leading-relaxed text-slate-400">
        Nothing is uploaded. Bank CSV import adds transactions. JSON restore replaces
        everything. Keep JSON backups somewhere safe if you switch browsers or clear site
        data.
      </p>

      {pendingFile ? (
        <ConfirmDialog
          title="Replace all data?"
          description={`Importing ${pendingFile.name} will overwrite transactions, categories, budgets, goals, and settings on this device.`}
          confirmLabel="Replace"
          busyLabel="Importing…"
          busy={busy === 'import'}
          danger
          onCancel={() => {
            setPendingFile(null)
            if (fileRef.current) fileRef.current.value = ''
          }}
          onConfirm={() => void confirmImport()}
        />
      ) : null}
    </section>
  )
}
