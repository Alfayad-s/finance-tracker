import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { BackButton } from '@/components/ui/BackButton'
import { useSettings } from '@/db/hooks'
import { useSettingsStore } from '@/stores/settingsStore'
import { Loader } from '@/components/ui/Loader'
import { ProfileEditor } from '@/components/ProfileEditor'
import { AVATAR_LABELS, AvatarFace, isAvatarId } from '@/components/avatars'

export function ProfilePage() {
  const settings = useSettings()
  const updateSettings = useSettingsStore((store) => store.updateSettings)
  const [editing, setEditing] = useState(false)

  if (!settings) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading profile..."
        subtitle="Reading your name and avatar on this device"
      />
    )
  }

  const avatarId = isAvatarId(settings.avatarId) ? settings.avatarId : 1
  const displayName = settings.displayName.trim()

  return (
    <section className="space-y-8">
      <header className="flex items-center gap-2">
        <BackButton to="/settings" label="Back to settings" />
        <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-slate-900">
          Profile
        </h1>
        {editing ? (
          <button
            type="button"
            className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            aria-label="Edit profile"
            onClick={() => setEditing(true)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <Pencil className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </header>

      {editing ? (
        <ProfileEditor
          name={settings.displayName}
          avatarId={avatarId}
          onSave={async (data) => {
            await updateSettings(data)
            setEditing(false)
          }}
        />
      ) : (
        <div className="flex flex-col items-center pt-4 text-center">
          <div className="size-24 overflow-hidden rounded-full bg-slate-100">
            <span className="flex size-full items-center justify-center">
              <span className="scale-[2.4]">
                <AvatarFace id={avatarId} />
              </span>
            </span>
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            {displayName || 'Your name'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{AVATAR_LABELS[avatarId]}</p>
          <p className="mt-3 max-w-xs text-xs leading-4 text-slate-400">
            This name appears on the home screen and in split groups. It stays on this device.
          </p>
        </div>
      )}
    </section>
  )
}
