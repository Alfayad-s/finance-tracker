import { BackButton } from '@/components/ui/BackButton'
import { useSettings } from '@/db/hooks'
import { useSettingsStore } from '@/stores/settingsStore'
import { Loader } from '@/components/ui/Loader'
import { ProfileEditor } from '@/components/ProfileEditor'
import { isAvatarId } from '@/components/avatars'

export function ProfilePage() {
  const settings = useSettings()
  const updateSettings = useSettingsStore((store) => store.updateSettings)

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

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-2">
        <BackButton to="/settings" label="Back to settings" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Profile</h1>
          <p className="text-sm text-slate-500">Name and avatar stay on this device</p>
        </div>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-white p-5">
        <ProfileEditor
          name={settings.displayName}
          avatarId={isAvatarId(settings.avatarId) ? settings.avatarId : 1}
          onSave={(data) => updateSettings(data)}
        />
      </section>
    </section>
  )
}
