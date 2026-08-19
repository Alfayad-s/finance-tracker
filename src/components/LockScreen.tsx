import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Fingerprint, Lock } from 'lucide-react'
import { resetAppData } from '@/db/backup'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useLockStore } from '@/stores/lockStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { PinDots, PinPad } from '@/components/PinPad'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PIN_LENGTH } from '@/utils/pin'

export function LockScreen() {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const unlock = useLockStore((store) => store.unlock)
  const unlockWithBiometric = useLockStore((store) => store.unlockWithBiometric)
  const biometricEnabled = useLockStore((store) => store.biometricEnabled)
  const lockedUntil = useLockStore((store) => store.lockedUntil)
  const displayName = useSettingsStore((store) => store.settings?.displayName?.trim() ?? '')
  const hydrate = useSettingsStore((store) => store.hydrate)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(biometricEnabled)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [cooldownMs, setCooldownMs] = useState(0)
  const coolingDown = cooldownMs > 0

  useFocusTrap(!confirmReset, () => undefined, ref)

  useEffect(() => {
    if (!lockedUntil) {
      setCooldownMs(0)
      return
    }
    const tick = () => {
      setCooldownMs(Math.max(0, lockedUntil - Date.now()))
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [lockedUntil])

  const tryBiometric = useCallback(async () => {
    if (busy || coolingDown || confirmReset) return
    setBusy(true)
    setError(null)
    try {
      const result = await unlockWithBiometric()
      if (result === 'fail') {
        setError('Could not unlock with this device. Use your PIN.')
      }
    } finally {
      setBusy(false)
    }
  }, [busy, confirmReset, coolingDown, unlockWithBiometric])

  useEffect(() => {
    if (!biometricEnabled) return
    const controller = new AbortController()
    void (async () => {
      const result = await unlockWithBiometric(controller.signal)
      if (controller.signal.aborted) return
      if (result === 'fail') {
        setError('Could not unlock with this device. Use your PIN.')
      }
      setBusy(false)
    })()
    return () => controller.abort()
  }, [biometricEnabled, unlockWithBiometric])

  const submit = useCallback(
    async (value: string) => {
      if (value.length !== PIN_LENGTH || busy || coolingDown || confirmReset) return
      setBusy(true)
      setError(null)
      try {
        const ok = await unlock(value)
        if (!ok) {
          setPin('')
          const stillCooling = Date.now() < (useLockStore.getState().lockedUntil ?? 0)
          setError(stillCooling ? 'Too many tries. Wait a moment.' : 'That PIN does not match')
        }
      } finally {
        setBusy(false)
      }
    },
    [busy, confirmReset, coolingDown, unlock],
  )

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-lg flex-col bg-white">
      <div className="h-1.5 bg-blue-600" aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex flex-1 flex-col px-5 pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none"
      >
        <div className="flex flex-1 flex-col items-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            {biometricEnabled ? (
              <Fingerprint className="size-6" aria-hidden />
            ) : (
              <Lock className="size-6" aria-hidden />
            )}
          </span>
          <h1 id={titleId} className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
            {displayName ? `Hi, ${displayName}` : 'Welcome back'}
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            {biometricEnabled
              ? 'Use Face ID, fingerprint, or your PIN'
              : 'Enter your PIN to open Finance Tracker'}
          </p>
          {biometricEnabled ? (
            <Button
              className="mt-6 px-4"
              disabled={busy || coolingDown || confirmReset}
              onClick={() => {
                void tryBiometric()
              }}
            >
              Unlock with this device
            </Button>
          ) : null}
          <div className="mt-8">
            <PinDots filled={pin.length} error={Boolean(error)} />
          </div>
          <p className="mt-4 min-h-5 text-center text-sm text-red-600" role="alert">
            {coolingDown ? `Try again in ${Math.ceil(cooldownMs / 1000)}s` : (error ?? '')}
          </p>
          <div className="mt-4 w-full">
            <PinPad
              value={pin}
              disabled={busy || coolingDown || confirmReset}
              onChange={(next) => {
                setError(null)
                setPin(next)
                if (next.length === PIN_LENGTH) void submit(next)
              }}
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-6 text-sm text-slate-500 hover:text-slate-800"
          onClick={() => {
            setResetError(null)
            setConfirmReset(true)
          }}
        >
          Forgot PIN?
        </button>
      </div>
      {confirmReset ? (
        <ConfirmDialog
          title="Reset this app?"
          description="The PIN cannot be recovered. Resetting deletes every transaction, budget, goal, receipt, and setting on this device."
          confirmLabel="Reset everything"
          busyLabel="Resetting…"
          busy={resetting}
          danger
          error={resetError}
          onCancel={() => {
            if (!resetting) setConfirmReset(false)
          }}
          onConfirm={() => {
            void (async () => {
              setResetting(true)
              setResetError(null)
              try {
                await resetAppData()
                await hydrate()
                setConfirmReset(false)
              } catch (caught) {
                setResetError(
                  caught instanceof Error ? caught.message : 'Could not reset this app',
                )
              } finally {
                setResetting(false)
              }
            })()
          }}
        />
      ) : null}
    </div>
  )
}
