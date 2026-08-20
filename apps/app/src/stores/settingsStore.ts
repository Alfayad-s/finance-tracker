import { create } from 'zustand'
import type { Settings } from '@/types'
import { SETTINGS_ID } from '@/db/constants'
import { db } from '@/db/db'
import { putSettings } from '@/db/hooks'
import { useLockStore } from '@/stores/lockStore'

interface SettingsStore {
  settings: Settings | null
  hydrated: boolean
  hydrate: () => Promise<void>
  updateSettings: (patch: Partial<Omit<Settings, 'id'>>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  hydrated: false,
  hydrate: async () => {
    document.documentElement.classList.remove('dark')
    const settings = (await db.settings.get(SETTINGS_ID)) ?? null
    const lock = useLockStore.getState()
    if (get().hydrated) lock.syncEnabled(settings)
    else lock.initFromSettings(settings)
    set({ settings, hydrated: true })
  },
  updateSettings: async (patch) => {
    const next = await putSettings({ ...patch, theme: 'light' })
    set({ settings: next })
  },
}))
