import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  addCategory,
  deleteCategory,
  updateCategory,
  useCategories,
} from '@/db/hooks'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loader } from '@/components/ui/Loader'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON_NAMES, CategoryIcon } from '@/utils/categoryIcons'
import type { Category, CategoryType } from '@/types'

const COLORS = ['#2563eb', '#3b82f6', '#1d4ed8', '#60a5fa', '#1e40af', '#38bdf8', '#6366f1'] as const

const COLOR_LABELS: Record<(typeof COLORS)[number], string> = {
  '#2563eb': 'Blue',
  '#3b82f6': 'Sky blue',
  '#1d4ed8': 'Deep blue',
  '#60a5fa': 'Light blue',
  '#1e40af': 'Navy',
  '#38bdf8': 'Cyan',
  '#6366f1': 'Indigo',
}

interface CategoryDraft {
  name: string
  type: CategoryType
  icon: string
  color: string
}

export function CategoriesPage() {
  const categories = useCategories()
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const visible = useMemo(
    () =>
      (categories ?? []).filter(
        (category) => category.type === tab || category.type === 'both',
      ),
    [categories, tab],
  )

  async function saveCategory(draft: CategoryDraft, current: Category | null) {
    const name = draft.name.trim()
    if (!name) {
      setError('Enter a category name')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (current) {
        await updateCategory(current.id, {
          name,
          icon: draft.icon,
          color: draft.color,
        })
      } else {
        await addCategory({
          name,
          icon: draft.icon,
          color: draft.color,
          type: draft.type === 'both' ? tab : draft.type,
          isDefault: false,
          order: categories?.length ?? 0,
        })
      }
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  if (!categories) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading categories..."
        subtitle="Reading categories on this device"
      />
    )
  }

  const editorCategory = editing === 'new' || editing === null ? null : editing

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BackButton to="/settings" label="Back to settings" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Categories
            </h1>
            <p className="text-sm text-slate-500">Pre-defined plus your own</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setEditing('new')
          }}
          className="rounded-full bg-blue-600 p-2 text-white"
          aria-label="Add category"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
        {(['expense', 'income'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTab(type)}
            aria-pressed={tab === type}
            className={cn(
              'rounded-xl py-2 text-sm font-medium capitalize',
              tab === type ? 'bg-blue-600 text-white' : 'text-slate-500',
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-blue-50 overflow-hidden rounded-2xl border border-blue-100 bg-white">
        {visible.map((category) => (
          <li key={category.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="flex size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${category.color}1a`, color: category.color }}
            >
              <CategoryIcon name={category.icon} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{category.name}</p>
              <p className="text-xs text-slate-400">
                {category.isDefault ? 'Built-in' : 'Custom'}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Edit ${category.name}`}
              onClick={() => {
                setError(null)
                setEditing(category)
              }}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
            {!category.isDefault ? (
              <button
                type="button"
                aria-label={`Delete ${category.name}`}
                onClick={() => {
                  setError(null)
                  setPendingDelete(category)
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {editing ? (
          <CategoryEditor
            title={editorCategory ? 'Edit category' : 'New category'}
            initial={
              editorCategory
                ? {
                    name: editorCategory.name,
                    type: editorCategory.type,
                    icon: editorCategory.icon,
                    color: editorCategory.color,
                  }
                : {
                    name: '',
                    type: tab,
                    icon: 'CircleEllipsis',
                    color: '#2563eb',
                  }
            }
            showType={!editorCategory}
            saving={saving}
            error={error}
            onClose={() => setEditing(null)}
            onSave={(draft) => saveCategory(draft, editorCategory)}
          />
        ) : null}
      </AnimatePresence>

      {pendingDelete ? (
        <ConfirmDialog
          title={`Delete ${pendingDelete.name}?`}
          description="Custom categories can be deleted only if no transactions use them."
          confirmLabel="Delete"
          danger
          error={error}
          onCancel={() => {
            setPendingDelete(null)
            setError(null)
          }}
          onConfirm={() => {
            void (async () => {
              try {
                await deleteCategory(pendingDelete.id)
                setPendingDelete(null)
                setError(null)
              } catch (caught) {
                setError(
                  caught instanceof Error ? caught.message : 'Could not delete this category',
                )
              }
            })()
          }}
        />
      ) : null}
    </section>
  )
}

function CategoryEditor({
  title,
  initial,
  showType,
  saving,
  error,
  onClose,
  onSave,
}: {
  title: string
  initial: CategoryDraft
  showType: boolean
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (values: CategoryDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(initial)
  const dialogRef = useRef<HTMLElement | null>(null)
  useFocusTrap(true, onClose, dialogRef)

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-lg">
      <motion.button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-editor-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 id="category-editor-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            void onSave(draft)
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              maxLength={24}
              placeholder="Groceries"
              className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
            />
          </label>

          {showType ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
              {(['expense', 'income'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraft({ ...draft, type })}
                  aria-pressed={draft.type === type}
                  className={cn(
                    'rounded-xl py-2 text-sm font-medium capitalize',
                    draft.type === type ? 'bg-blue-600 text-white' : 'text-slate-500',
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Icon</legend>
            <div className="grid grid-cols-7 gap-2">
              {CATEGORY_ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: name })}
                  aria-label={name}
                  aria-pressed={draft.icon === name}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full border',
                    draft.icon === name
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-blue-100 text-slate-500',
                  )}
                >
                  <CategoryIcon name={name} className="size-4" />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Color</legend>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={COLOR_LABELS[color]}
                  aria-pressed={draft.color === color}
                  onClick={() => setDraft({ ...draft, color })}
                  className={cn(
                    'size-8 rounded-full border-2',
                    draft.color === color ? 'border-slate-900' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </fieldset>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={saving} className="w-full py-3">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </motion.section>
    </div>
  )
}
