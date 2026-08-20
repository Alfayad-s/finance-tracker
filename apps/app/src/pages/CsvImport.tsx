import { useMemo, useRef, useState } from 'react'
import {
  addTransactions,
  getImportRules,
  upsertImportRules,
  useCategories,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loader } from '@/components/ui/Loader'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currency'
import { formatDisplayDate } from '@/utils/date'
import {
  BANK_PRESETS,
  MAPPING_ROLES,
  PdfPasswordError,
  buildPreviewRows,
  mappingFromPreset,
  mappingIsComplete,
  mapStatementRows,
  parseStatementFile,
  suggestCategoryId,
  type BankPresetId,
  type ColumnMapping,
  type ParsedCsv,
  type PreviewRow,
} from '@/utils/csvImport'
import type { Category, ImportRule, TransactionType } from '@/types'

const PAGE_SIZE = 100
const MAX_FILE_BYTES = 12 * 1024 * 1024

export function CsvImportPage() {
  const categories = useCategories()
  const transactions = useTransactions()
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const sourceRef = useRef<'bank' | 'supermoney'>('bank')
  const pinnedRef = useRef(new Set<string>())
  const rulesRef = useRef<ImportRule[]>([])

  const [step, setStep] = useState<'pick' | 'map' | 'preview'>('pick')
  const [fileName, setFileName] = useState('')
  const [csv, setCsv] = useState<ParsedCsv | null>(null)
  const [presetId, setPresetId] = useState<BankPresetId>('generic')
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')

  const currency = settings?.currency ?? 'INR'
  const mappingReady = mapping ? mappingIsComplete(mapping) : false
  const selectedCount = preview.filter((row) => row.selected && !row.invalidReason).length
  const duplicateCount = preview.filter((row) => row.duplicate).length
  const invalidCount = preview.filter((row) => row.invalidReason).length
  const pageCount = Math.max(1, Math.ceil(preview.length / PAGE_SIZE))
  const visible = preview.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const sampleRows = useMemo(() => csv?.rows.slice(0, 3) ?? [], [csv])

  if (!categories || !transactions) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading data..."
        subtitle="Reading transactions stored on this device"
      />
    )
  }

  const allCategories = categories
  const allTransactions = transactions

  async function onFile(file: File | undefined, unlockPassword?: string) {
    setError(null)
    setMessage(null)
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 12 MB')
      return
    }
    setBusy(true)
    try {
      const preferred = sourceRef.current === 'supermoney' ? 'supermoney' : null
      const prepared = await parseStatementFile(file, unlockPassword || undefined, preferred)
      pinnedRef.current = new Set()
      setFileName(file.name)
      setCsv(prepared.csv)
      setPresetId(prepared.presetId)
      setMapping(prepared.mapping)
      setPreview([])
      setPage(0)
      setPendingFile(null)
      setPassword('')
      setStep('map')
    } catch (caught) {
      if (caught instanceof PdfPasswordError) {
        setPendingFile(file)
        setStep('pick')
        setError(caught.message)
        if (caught.incorrect) setPassword('')
        return
      }
      setCsv(null)
      setMapping(null)
      setPendingFile(null)
      setStep('pick')
      setError(caught instanceof Error ? caught.message : 'Could not read that file')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function changePreset(next: BankPresetId) {
    if (!csv) return
    setPresetId(next)
    setMapping(mappingFromPreset(csv.headers, next))
  }

  function changeRole(role: keyof ColumnMapping, value: string) {
    setMapping((current) => {
      if (!current) return current
      return { ...current, [role]: value === '' ? null : Number(value) }
    })
  }

  async function goPreview() {
    if (!csv || !mapping || !mappingIsComplete(mapping)) return
    setBusy(true)
    setError(null)
    try {
      const rules = await getImportRules()
      rulesRef.current = rules
      const mapped = mapStatementRows(csv, mapping)
      const rows = buildPreviewRows(mapped, allCategories, allTransactions, rules)
      pinnedRef.current = new Set()
      setPreview(rows)
      setPage(0)
      setStep('preview')
      if (rows.length === 0) {
        setError('No rows were found under that header')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not map that file')
    } finally {
      setBusy(false)
    }
  }

  function toggleRow(id: string, selected: boolean) {
    setPreview((rows) =>
      rows.map((row) => (row.id === id && !row.invalidReason ? { ...row, selected } : row)),
    )
  }

  function selectNew() {
    setPreview((rows) =>
      rows.map((row) => ({
        ...row,
        selected: !row.invalidReason && !row.duplicate,
      })),
    )
  }

  function selectNone() {
    setPreview((rows) => rows.map((row) => ({ ...row, selected: false })))
  }

  function changeType(id: string, type: TransactionType) {
    setPreview((rows) =>
      rows.map((row) => {
        if (row.id !== id || row.invalidReason) return row
        const category = allCategories.find((item) => item.id === row.categoryId)
        const fits = category && (category.type === type || category.type === 'both')
        return {
          ...row,
          type,
          categoryId: fits
            ? row.categoryId
            : suggestCategoryId(row.note, type, allCategories, rulesRef.current),
        }
      }),
    )
  }

  function changeCategory(id: string, categoryId: string) {
    const nextPinned = new Set(pinnedRef.current)
    nextPinned.add(id)
    pinnedRef.current = nextPinned
    setPreview((rows) => {
      const source = rows.find((row) => row.id === id)
      if (!source) return rows
      return rows.map((row) => {
        if (row.id === id) return { ...row, categoryId }
        if (nextPinned.has(row.id)) return row
        if (row.merchantKey && row.merchantKey === source.merchantKey && !row.invalidReason) {
          return { ...row, categoryId }
        }
        return row
      })
    })
  }

  async function confirmImport() {
    const chosen = preview.filter((row) => row.selected && !row.invalidReason && row.categoryId)
    if (chosen.length === 0) return
    setBusy(true)
    setError(null)
    try {
      await addTransactions(
        chosen.map((row) => ({
          type: row.type,
          amount: row.amount,
          categoryId: row.categoryId,
          date: row.date,
          note: row.note || undefined,
        })),
      )
      await upsertImportRules(
        chosen
          .filter((row) => row.merchantKey)
          .map((row) => ({ keyword: row.merchantKey, categoryId: row.categoryId })),
      )
      setMessage(
        `Added ${chosen.length} ${chosen.length === 1 ? 'transaction' : 'transactions'}. Duplicates were not overwritten.`,
      )
      setConfirm(false)
      setStep('pick')
      setCsv(null)
      setMapping(null)
      setPreview([])
      setFileName('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not import those rows')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-2">
        <BackButton to="/settings/backup" label="Back to export and import" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Bank statement import
          </h1>
          <p className="text-sm text-slate-500">Adds transactions. Nothing is uploaded.</p>
        </div>
      </header>

      {step === 'pick' ? (
        <section className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
          <p className="text-sm leading-relaxed text-slate-500">
            Choose SuperMoney transaction history or a bank statement. CSV, Excel, and PDF
            stay on this device. Existing transactions are not replaced.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.xlsm,.pdf,text/csv,text/plain,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label="Statement file"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <div className="grid gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                sourceRef.current = 'supermoney'
                fileRef.current?.click()
              }}
              className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-slate-50 px-3 py-3 text-left transition-[opacity,transform] hover:bg-blue-50 disabled:opacity-50"
            >
              <img
                src="/social-icons/supermoney-logo.png"
                alt=""
                width={300}
                height={300}
                className="size-12 shrink-0 object-contain"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">SuperMoney</span>
                <span className="block text-xs text-slate-500">
                  Transaction history · CSV, Excel, or PDF
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                sourceRef.current = 'bank'
                fileRef.current?.click()
              }}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
            >
              {busy ? 'Reading…' : 'Bank statement CSV, Excel, or PDF'}
            </button>
          </div>
          {pendingFile ? (
            <form
              className="space-y-3 rounded-xl bg-slate-50 p-3"
              onSubmit={(event) => {
                event.preventDefault()
                void onFile(pendingFile, password)
              }}
            >
              <p className="text-sm text-slate-600">
                Unlock <span className="font-medium text-slate-800">{pendingFile.name}</span>
              </p>
              <input
                type="password"
                value={password}
                autoComplete="off"
                placeholder="Statement password"
                aria-label="PDF password"
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <Button type="submit" className="w-full" disabled={busy || !password.trim()}>
                {busy ? 'Unlocking…' : 'Unlock PDF'}
              </Button>
            </form>
          ) : null}
        </section>
      ) : null}

      {step === 'map' && csv && mapping ? (
        <section className="space-y-4 rounded-2xl border border-blue-100 bg-white p-4">
          <p className="text-sm text-slate-500">
            Detected <span className="font-medium text-slate-800">{fileName}</span>
          </p>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700">Bank layout</span>
            <select
              value={presetId}
              onChange={(event) => changePreset(event.target.value as BankPresetId)}
              className="max-w-[60%] rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
            >
              {BANK_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          {MAPPING_ROLES.map((role) => (
            <label key={role.key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-700">{role.label}</span>
              <select
                value={mapping[role.key] ?? ''}
                onChange={(event) => changeRole(role.key, event.target.value)}
                className="max-w-[60%] rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
              >
                <option value="">—</option>
                {csv.headers.map((header, index) => (
                  <option key={`${role.key}-${index}`} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {!mappingReady ? (
            <p className="text-sm text-red-600">Pick a date column and an amount, debit, or credit column.</p>
          ) : null}
          {sampleRows.length > 0 ? (
            <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">First rows</p>
              {sampleRows.map((row, index) => (
                <p key={index} className="truncate text-xs text-slate-600">
                  {row.filter(Boolean).slice(0, 4).join(' · ')}
                </p>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-slate-100 text-slate-700"
              onClick={() => {
                setStep('pick')
                setCsv(null)
                setMapping(null)
              }}
            >
              Back
            </Button>
            <Button disabled={!mappingReady || busy} onClick={() => void goPreview()}>
              {busy ? 'Reading…' : 'Preview'}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 'preview' ? (
        <section className="space-y-4">
          <section className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-sm text-slate-600">
              {selectedCount} selected
              {duplicateCount > 0 ? ` · ${duplicateCount} already in the app` : ''}
              {invalidCount > 0 ? ` · ${invalidCount} skipped` : ''}
            </p>
            <div className="flex gap-2">
              <Button className="bg-slate-100 text-slate-700" onClick={selectNew}>
                Select new
              </Button>
              <Button className="bg-slate-100 text-slate-700" onClick={selectNone}>
                Clear
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Changing a category also updates other rows with a similar description.
            </p>
          </section>

          <ul className="space-y-2">
            {visible.map((row) => (
              <PreviewItem
                key={row.id}
                row={row}
                categories={allCategories}
                currency={currency}
                onToggle={toggleRow}
                onType={changeType}
                onCategory={changeCategory}
              />
            ))}
          </ul>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                className="bg-slate-100 text-slate-700"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <p className="text-xs text-slate-500">
                {page + 1} / {pageCount}
              </p>
              <Button
                className="bg-slate-100 text-slate-700"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-slate-100 text-slate-700" onClick={() => setStep('map')}>
              Back
            </Button>
            <Button disabled={selectedCount === 0 || busy} onClick={() => setConfirm(true)}>
              Add {selectedCount || ''}
            </Button>
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <p className="text-xs leading-relaxed text-slate-400">
        Statements stay on this device. Excel and PDF text statements work; scanned image
        PDFs do not. JSON restore on the previous screen still replaces everything; this
        import only appends.
      </p>

      {confirm ? (
        <ConfirmDialog
          title="Add these transactions?"
          description={`${selectedCount} ${selectedCount === 1 ? 'row' : 'rows'} will be added. Existing matches stay untouched.`}
          confirmLabel="Add"
          busyLabel="Adding…"
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() => void confirmImport()}
        />
      ) : null}
    </section>
  )
}

function PreviewItem({
  row,
  categories,
  currency,
  onToggle,
  onType,
  onCategory,
}: {
  row: PreviewRow
  categories: Category[]
  currency: string
  onToggle: (id: string, selected: boolean) => void
  onType: (id: string, type: TransactionType) => void
  onCategory: (id: string, categoryId: string) => void
}) {
  const typeCategories = categories.filter(
    (category) => category.type === row.type || category.type === 'both',
  )
  const dateLabel = /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? formatDisplayDate(row.date) : row.date

  return (
    <li
      className={cn(
        'rounded-2xl border bg-white p-3',
        row.invalidReason ? 'border-red-100' : 'border-blue-100',
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-blue-600"
          checked={row.selected}
          disabled={Boolean(row.invalidReason)}
          aria-label={`Include ${row.note || dateLabel}`}
          onChange={(event) => onToggle(row.id, event.target.checked)}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">{dateLabel}</p>
            <p className="text-sm font-medium text-slate-900">
              {row.invalidReason ? '—' : formatCurrency(row.amount, currency)}
            </p>
          </div>
          <p className="truncate text-sm text-slate-600">{row.note || 'No description'}</p>
          {row.duplicate ? <p className="text-xs text-amber-700">Already in the app · skipped</p> : null}
          {row.invalidReason ? <p className="text-xs text-red-600">{row.invalidReason}</p> : null}
          {row.invalidReason ? null : (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={row.type}
                aria-label="Type"
                onChange={(event) => onType(row.id, event.target.value as TransactionType)}
                className="rounded-xl border border-blue-100 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                value={row.categoryId}
                aria-label="Category"
                onChange={(event) => onCategory(row.id, event.target.value)}
                className="rounded-xl border border-blue-100 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none"
              >
                {typeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
