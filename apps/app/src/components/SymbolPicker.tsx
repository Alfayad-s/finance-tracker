import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_EMOJIS,
  CATEGORY_ICON_NAMES,
  CategoryIcon,
  toEmojiIcon,
} from '@/utils/categoryIcons'

export function SymbolPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (icon: string) => void
}) {
  const [tab, setTab] = useState<'icons' | 'emoji'>(value.startsWith('emoji:') ? 'emoji' : 'icons')
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()

  const icons = useMemo(() => {
    if (!needle) return CATEGORY_ICON_NAMES
    return CATEGORY_ICON_NAMES.filter((name) => name.toLowerCase().includes(needle))
  }, [needle])

  const emojis = useMemo(() => {
    if (!needle) return CATEGORY_EMOJIS
    return CATEGORY_EMOJIS.filter(
      (item) => item.label.includes(needle) || item.emoji.includes(query.trim()),
    )
  }, [needle, query])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-1">
        {(['icons', 'emoji'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'rounded-lg py-1.5 text-sm font-medium capitalize',
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
          >
            {id === 'icons' ? 'Icons' : 'Emoji'}
          </button>
        ))}
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === 'emoji' ? 'Search pizza, rent, gym…' : 'Search wallet, car, home…'}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm outline-none placeholder:text-slate-400"
        />
      </label>

      {tab === 'icons' ? (
        <div className="grid max-h-48 grid-cols-7 gap-2 overflow-y-auto pr-0.5">
          {icons.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              aria-label={name}
              aria-pressed={value === name}
              className={cn(
                'flex size-10 items-center justify-center rounded-full border',
                value === name
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300',
              )}
            >
              <CategoryIcon name={name} className="size-4" />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid max-h-48 grid-cols-7 gap-2 overflow-y-auto pr-0.5">
          {emojis.map((item) => {
            const icon = toEmojiIcon(item.emoji)
            return (
              <button
                key={item.emoji}
                type="button"
                onClick={() => onChange(icon)}
                aria-label={item.label}
                aria-pressed={value === icon}
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border text-lg',
                  value === icon
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                {item.emoji}
              </button>
            )
          })}
        </div>
      )}

      {((tab === 'icons' && icons.length === 0) || (tab === 'emoji' && emojis.length === 0)) ? (
        <p className="text-center text-xs text-slate-400">No matches. Try another word.</p>
      ) : null}
    </div>
  )
}
