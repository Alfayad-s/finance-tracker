import { useMemo, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  addTransactions,
  getImportRules,
  upsertImportRules,
  useCategories,
  useSettings,
  useTransactions,
} from '@/db/hooks'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loader } from '@/components/ui/Loader'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currency'
import { formatDisplayDate } from '@/utils/date'
import {
  BANK_PRESETS,
  MAPPING_ROLES,
  buildPreviewRows,
  mappingFromPreset,
  mappingIsComplete,
  mapStatementRows,
  prepareCsv,
  suggestCategoryId,
  type BankPresetId,
  type ColumnMapping,
  type ParsedCsv,
  type PreviewRow,
} from '@/utils/csvImport'
import type { Category, ImportRule, TransactionType } from '@/types'

const PAGE_SIZE = 100
const MAX_FILE_BYTES = 8 * 1024 * 1024

export function CsvImportPage() {
  const categories = useCategories()
  const transactions = useTransactions()
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
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

  async function onFile(file: File | undefined) {
    setError(null)
    setMessage(null)
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 8 MB')
      return
    }
    try {
      const text = await file.text()
      const prepared = prepareCsv(text, file.name)
      pinnedRef.current = new Set()
      setFileName(file.name)
      setCsv(prepared.csv)
      setPresetId(prepared.presetId)
      setMapping(prepared.mapping)
      setPreview([])
      setPage(0)
      setStep('map')
    } catch (caught) {
      setCsv(null)
      setMapping(null)
      setStep('pick')
      setError(caught instanceof Error ? caught.message : 'Could not read that CSV')
    } finally {
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
        <Link
          to="/settings/backup"
          aria-label="Back to export and import"
          className="rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Bank statement CSV
          </h1>
          <p className="text-sm text-slate-500">Adds transactions. Nothing is uploaded.</p>
        </div>
      </header>

      {step === 'pick' ? (
        <section className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
          <p className="text-sm leading-relaxed text-slate-500">
            Choose a CSV from HDFC, SBI, ICICI, Axis, Kotak, or any statement with date and
            amount columns. Existing transactions stay as they are.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            aria-label="Bank statement CSV"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <Button className="w-full" onClick={() => fileRef.current?.click()}>
            Choose CSV file
          </Button>
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
              className="max-w-[60%] rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
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
                className="max-w-[60%] rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
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
        Statements stay on this device. JSON restore on the previous screen still replaces
        everything; this import only appends.
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
                className="rounded-xl border border-blue-100 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                value={row.categoryId}
                aria-label="Category"
                onChange={(event) => onCategory(row.id, event.target.value)}
                className="rounded-xl border border-blue-100 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
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
