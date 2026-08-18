import { create } from 'zustand'
import type { Settings } from '@/types'
import { SETTINGS_ID } from '@/db/constants'
import { db } from '@/db/db'
import { putSettings } from '@/db/hooks'

interface SettingsStore {
  settings: Settings | null
  hydrated: boolean
  hydrate: () => Promise<void>
  updateSettings: (patch: Partial<Omit<Settings, 'id'>>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  hydrated: false,
  hydrate: async () => {
    document.documentElement.classList.remove('dark')
    const settings = (await db.settings.get(SETTINGS_ID)) ?? null
    set({ settings, hydrated: true })
  },
  updateSettings: async (patch) => {
    const next = await putSettings({ ...patch, theme: 'light' })
    set({ settings: next })
  },
}))
