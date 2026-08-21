import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AVATAR_IDS, AVATAR_LABELS, AvatarFace, type AvatarId } from '@/components/avatars'

export function ProfileEditor({
  name,
  avatarId,
  onSave,
}: {
  name: string
  avatarId: AvatarId
  onSave: (data: { displayName: string; avatarId: AvatarId }) => Promise<void>
}) {
  const [selected, setSelected] = useState<AvatarId>(avatarId)
  const [username, setUsername] = useState(name)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelected(avatarId)
    setUsername(name)
  }, [avatarId, name])

  const trimmed = username.trim()
  const showError = trimmed.length > 0 && trimmed.length < 3
  const dirty = trimmed !== name.trim() || selected !== avatarId
  const canSave = dirty && !showError

  async function save() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ displayName: trimmed, avatarId: selected })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-slate-900" htmlFor="profile-name">
          Display name
        </label>
        <div className="mt-2 flex items-center justify-end">
          <span
            className={cn(
              'text-xs tabular-nums',
              username.length >= 18 ? 'text-slate-600' : 'text-slate-400',
            )}
          >
            {username.length}/20
          </span>
        </div>
        <input
          id="profile-name"
          value={username}
          maxLength={20}
          autoComplete="nickname"
          spellCheck={false}
          placeholder="How you appear to friends"
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={showError}
          aria-describedby={showError ? 'profile-name-error' : 'profile-name-hint'}
          className={cn(
            'mt-1 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400',
            showError
              ? 'border-red-300 focus:border-red-400'
              : 'border-slate-200 focus:border-slate-400',
          )}
        />
        <AnimatePresence>
          {showError ? (
            <motion.p
              id="profile-name-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-xs text-red-600"
            >
              Use at least 3 characters.
            </motion.p>
          ) : (
            <p id="profile-name-hint" className="mt-2 text-xs leading-4 text-slate-400">
              Friends see this when you join a split.
            </p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-900">Avatar</p>
        <p className="mt-1 text-xs text-slate-400">{AVATAR_LABELS[selected]}</p>
        <div className="mt-3 grid grid-cols-6 gap-2.5">
          {AVATAR_IDS.map((id) => {
            const isSelected = selected === id
            return (
              <button
                key={id}
                type="button"
                aria-label={`Select ${AVATAR_LABELS[id]}`}
                aria-pressed={isSelected}
                onClick={() => setSelected(id)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-full',
                  isSelected
                    ? 'ring-2 ring-slate-900 ring-offset-2'
                    : 'ring-1 ring-slate-200 hover:ring-slate-400',
                )}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="scale-[1.35]">
                    <AvatarFace id={id} />
                  </span>
                </span>
                {isSelected ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/25">
                    <Check className="size-3.5 text-white" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <Button className="w-full" disabled={!canSave || saving} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
