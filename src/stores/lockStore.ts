import { create } from 'zustand'
import type { Settings } from '@/types'
import { SETTINGS_ID } from '@/db/constants'
import { db } from '@/db/db'
import { putSettings } from '@/db/hooks'
import { DEFAULT_SETTINGS } from '@/db/seed'
import { hashPin, pinsMatch } from '@/utils/pin'
import { usePrivacyStore } from '@/stores/privacyStore'
import {
  isWebAuthnCancel,
  registerPlatformCredential,
  verifyPlatformCredential,
} from '@/utils/webauthn'

const FAIL_LIMIT = 5
const COOLDOWN_MS = 15_000

function hasPinLock(settings: Settings | null | undefined) {
  return Boolean(settings?.pinHash && settings?.pinSalt)
}

function hasBiometric(settings: Settings | null | undefined) {
  return hasPinLock(settings) && Boolean(settings?.webauthnCredentialId)
}

export type BiometricUnlockResult = 'ok' | 'cancel' | 'fail'

interface LockStore {
  enabled: boolean
  biometricEnabled: boolean
  unlocked: boolean
  failedAttempts: number
  lockedUntil: number | null
  initFromSettings: (settings: Settings | null) => void
  syncEnabled: (settings: Settings | null) => void
  lock: () => void
  verify: (pin: string) => Promise<boolean>
  unlock: (pin: string) => Promise<boolean>
  unlockWithBiometric: (signal?: AbortSignal) => Promise<BiometricUnlockResult>
  enable: (pin: string) => Promise<Settings>
  change: (currentPin: string, nextPin: string) => Promise<Settings>
  disable: (pin: string) => Promise<Settings | null>
  enableBiometric: () => Promise<Settings>
  disableBiometric: () => Promise<Settings>
}

function applyLockFlags(settings: Settings | null) {
  return {
    enabled: hasPinLock(settings),
    biometricEnabled: hasBiometric(settings),
  }
}

async function readSettings() {
  return (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS
}

export const useLockStore = create<LockStore>((set, get) => ({
  enabled: false,
  biometricEnabled: false,
  unlocked: true,
  failedAttempts: 0,
  lockedUntil: null,

  initFromSettings: (settings) => {
    set({
      ...applyLockFlags(settings),
      unlocked: !hasPinLock(settings),
      failedAttempts: 0,
      lockedUntil: null,
    })
  },

  syncEnabled: (settings) => {
    const flags = applyLockFlags(settings)
    set((state) => ({
      ...flags,
      unlocked: flags.enabled ? state.unlocked : true,
      failedAttempts: flags.enabled ? state.failedAttempts : 0,
      lockedUntil: flags.enabled ? state.lockedUntil : null,
    }))
  },

  lock: () => {
    if (!get().enabled) return
    usePrivacyStore.getState().hidePeek()
    set({ unlocked: false })
  },

  verify: async (pin) => {
    const settings = await readSettings()
    if (!settings.pinHash || !settings.pinSalt) return false
    return pinsMatch(pin, settings.pinSalt, settings.pinHash)
  },

  unlock: async (pin) => {
    if (Date.now() < (get().lockedUntil ?? 0)) return false

    const settings = await readSettings()
    if (!hasPinLock(settings) || !settings.pinHash || !settings.pinSalt) {
      set({
        enabled: false,
        biometricEnabled: false,
        unlocked: true,
        failedAttempts: 0,
        lockedUntil: null,
      })
      return true
    }

    const ok = await pinsMatch(pin, settings.pinSalt, settings.pinHash)
    if (ok) {
      set({ unlocked: true, failedAttempts: 0, lockedUntil: null })
      return true
    }

    const failedAttempts = get().failedAttempts + 1
    if (failedAttempts >= FAIL_LIMIT) {
      set({ failedAttempts: 0, lockedUntil: Date.now() + COOLDOWN_MS })
    } else {
      set({ failedAttempts })
    }
    return false
  },

  unlockWithBiometric: async (signal) => {
    if (Date.now() < (get().lockedUntil ?? 0)) return 'fail'
    const settings = await readSettings()
    if (!settings.webauthnCredentialId || !hasPinLock(settings)) return 'fail'
    try {
      const ok = await verifyPlatformCredential(settings.webauthnCredentialId, signal)
      if (!ok) return 'fail'
      set({ unlocked: true, failedAttempts: 0, lockedUntil: null })
      return 'ok'
    } catch (error) {
      if (isWebAuthnCancel(error)) return 'cancel'
      return 'fail'
    }
  },

  enable: async (pin) => {
    const hashed = await hashPin(pin)
    const next = await putSettings({ pinHash: hashed.hash, pinSalt: hashed.salt })
    set({
      enabled: true,
      biometricEnabled: hasBiometric(next),
      unlocked: true,
      failedAttempts: 0,
      lockedUntil: null,
    })
    return next
  },

  change: async (currentPin, nextPin) => {
    const settings = await readSettings()
    if (!settings.pinHash || !settings.pinSalt) {
      throw new Error('No PIN is set on this device')
    }
    const ok = await pinsMatch(currentPin, settings.pinSalt, settings.pinHash)
    if (!ok) {
      throw new Error('That PIN does not match')
    }
    const hashed = await hashPin(nextPin)
    const next = await putSettings({ pinHash: hashed.hash, pinSalt: hashed.salt })
    set({ enabled: true, unlocked: true, failedAttempts: 0, lockedUntil: null })
    return next
  },

  disable: async (pin) => {
    const settings = await readSettings()
    if (!settings.pinHash || !settings.pinSalt) {
      set({ enabled: false, biometricEnabled: false, unlocked: true })
      return settings
    }
    const ok = await pinsMatch(pin, settings.pinSalt, settings.pinHash)
    if (!ok) return null

    const next: Settings = { ...settings, id: SETTINGS_ID }
    delete next.pinHash
    delete next.pinSalt
    delete next.webauthnCredentialId
    await db.settings.put(next)
    set({
      enabled: false,
      biometricEnabled: false,
      unlocked: true,
      failedAttempts: 0,
      lockedUntil: null,
    })
    return next
  },

  enableBiometric: async () => {
    if (!get().enabled) {
      throw new Error('Turn on PIN lock first')
    }
    const credentialId = await registerPlatformCredential()
    const next = await putSettings({ webauthnCredentialId: credentialId })
    set({ biometricEnabled: true })
    return next
  },

  disableBiometric: async () => {
    const settings = await readSettings()
    const next: Settings = { ...settings, id: SETTINGS_ID }
    delete next.webauthnCredentialId
    await db.settings.put(next)
    set({ biometricEnabled: false })
    return next
  },
}))
