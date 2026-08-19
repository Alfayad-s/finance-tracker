import { useEffect, useState } from 'react'
import { Check, User2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  AVATAR_IDS,
  AVATAR_LABELS,
  AVATAR_RGB,
  AvatarFace,
  type AvatarId,
} from '@/components/avatars'

export function ProfileEditor({
  name,
  avatarId,
  onSave,
}: {
  name: string
  avatarId: AvatarId
  onSave: (data: { displayName: string; avatarId: AvatarId }) => Promise<void>
}) {
  const shouldReduceMotion = useReducedMotion()
  const [selected, setSelected] = useState<AvatarId>(avatarId)
  const [username, setUsername] = useState(name)
  const [focused, setFocused] = useState(false)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    setSelected(avatarId)
    setUsername(name)
  }, [avatarId, name])

  const trimmed = username.trim()
  const showError = trimmed.length > 0 && trimmed.length < 3
  const dirty = trimmed !== name.trim() || selected !== avatarId
  const canSave = dirty && !showError
  const rgb = AVATAR_RGB[selected]

  async function save() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ displayName: trimmed, avatarId: selected })
      setPicking(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-36">
          <motion.div
            animate={{
              boxShadow: `0 0 0 2px rgba(${rgb}, 0.55), 0 6px 24px rgba(${rgb}, 0.18)`,
            }}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }
            }
          />
          <div className="relative size-full overflow-hidden rounded-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }
                }
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="scale-[3.6]">
                  <AvatarFace id={selected} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] tracking-[0.12em] text-slate-400 uppercase"
          >
            {AVATAR_LABELS[selected]}
          </motion.span>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          className="text-sm font-medium text-blue-600"
        >
          {picking ? 'Hide avatars' : 'Change avatar'}
        </button>

        <AnimatePresence>
          {picking ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }
              }
              className="overflow-hidden"
            >
              <div className="grid max-h-56 grid-cols-4 gap-2.5 overflow-y-auto pr-1">
                {AVATAR_IDS.map((id) => {
                  const isSelected = selected === id
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      aria-label={`Select ${AVATAR_LABELS[id]}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelected(id)}
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                      className={cn(
                        'relative size-12 overflow-hidden rounded-xl border bg-slate-50',
                        isSelected
                          ? 'border-blue-200 opacity-100 ring-2 ring-blue-600 ring-offset-2'
                          : 'border-blue-100 opacity-50 hover:opacity-100',
                      )}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="scale-[2]">
                          <AvatarFace id={id} />
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-blue-600">
                          <Check className="size-3 text-white" aria-hidden />
                        </span>
                      ) : null}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700" htmlFor="profile-name">
            Name
          </label>
          <span
            className={cn(
              'text-xs tabular-nums',
              username.length >= 18 ? 'text-amber-600' : 'text-slate-400',
            )}
          >
            {username.length}/20
          </span>
        </div>
        <div className="relative">
          <input
            id="profile-name"
            value={username}
            maxLength={20}
            autoComplete="nickname"
            spellCheck={false}
            placeholder="Your name"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(event) => setUsername(event.target.value)}
            aria-invalid={showError}
            aria-describedby={showError ? 'profile-name-error' : undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-slate-50 pr-3 pl-9 text-sm text-slate-900 outline-none placeholder:text-slate-400',
              showError ? 'border-red-300' : 'border-blue-100',
            )}
          />
          <User2
            aria-hidden
            className={cn(
              'absolute top-1/2 left-3 size-4 -translate-y-1/2',
              focused ? 'text-slate-700' : 'text-slate-400',
            )}
          />
        </div>
        <AnimatePresence>
          {showError ? (
            <motion.p
              id="profile-name-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-red-600"
            >
              Name must be at least 3 characters
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <Button className="w-full" disabled={!canSave || saving} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  )
}
