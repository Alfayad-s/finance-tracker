import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'
import { useLockStore } from '@/stores/lockStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { PinDots, PinPad } from '@/components/PinPad'
import { Button } from '@/components/ui/Button'
import { PIN_LENGTH } from '@/utils/pin'
import { isPlatformUnlockAvailable, isWebAuthnCancel } from '@/utils/webauthn'
import type { Settings } from '@/types'

type SheetMode = 'enable' | 'disable' | 'change' | null
type Step = 'current' | 'next' | 'confirm'

export function PinLockSettings() {
  const enabled = useLockStore((store) => store.enabled)
  const biometricEnabled = useLockStore((store) => store.biometricEnabled)
  const enableBiometric = useLockStore((store) => store.enableBiometric)
  const disableBiometric = useLockStore((store) => store.disableBiometric)
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioBusy, setBioBusy] = useState(false)
  const [bioError, setBioError] = useState<string | null>(null)

  useEffect(() => {
    void isPlatformUnlockAvailable().then(setBioAvailable)
  }, [])

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <h2 className="px-4 pt-4 text-sm font-semibold text-slate-900">Lock</h2>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p id="pin-lock-label" className="text-sm text-slate-700">
              PIN lock
            </p>
            <p className="text-xs text-slate-400">Ask for a 4-digit PIN when you leave the app</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="pin-lock-label"
            onClick={() => setSheet(enabled ? 'disable' : 'enable')}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              enabled ? 'bg-blue-600' : 'bg-slate-200',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-[left,right]',
                enabled ? 'right-0.5 left-auto' : 'left-0.5 right-auto',
              )}
            />
          </button>
        </div>
        {enabled && bioAvailable ? (
          <div className="flex items-center justify-between gap-4 border-t border-blue-50 px-4 py-3">
            <div className="min-w-0">
              <p id="bio-lock-label" className="text-sm text-slate-700">
                Face ID & fingerprint
              </p>
              <p className="text-xs text-slate-400">
                Unlock with this device. PIN still works as a backup.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={biometricEnabled}
              aria-labelledby="bio-lock-label"
              disabled={bioBusy}
              onClick={() => {
                void (async () => {
                  setBioBusy(true)
                  setBioError(null)
                  try {
                    const next = biometricEnabled
                      ? await disableBiometric()
                      : await enableBiometric()
                    useSettingsStore.setState({ settings: next })
                  } catch (caught) {
                    if (!isWebAuthnCancel(caught)) {
                      setBioError(
                        caught instanceof Error
                          ? caught.message
                          : 'Could not set up device unlock',
                      )
                    }
                  } finally {
                    setBioBusy(false)
                  }
                })()
              }}
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
                biometricEnabled ? 'bg-blue-600' : 'bg-slate-200',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-[left,right]',
                  biometricEnabled ? 'right-0.5 left-auto' : 'left-0.5 right-auto',
                )}
              />
            </button>
          </div>
        ) : null}
        {bioError ? (
          <p className="border-t border-blue-50 px-4 py-2 text-xs text-red-600" role="alert">
            {bioError}
          </p>
        ) : null}
        {enabled ? (
          <button
            type="button"
            onClick={() => setSheet('change')}
            className="flex w-full items-center justify-between border-t border-blue-50 px-4 py-3 text-left text-sm text-slate-700"
          >
            Change PIN
            <ChevronRight className="size-4 text-slate-400" aria-hidden />
          </button>
        ) : null}
        <p className="border-t border-blue-50 px-4 py-3 text-xs leading-relaxed text-slate-400">
          This is a screen lock, not encryption. Data still lives in this browser. If you
          forget the PIN, you will need to reset the app.
        </p>
      </section>
      {sheet ? <PinSheet mode={sheet} onClose={() => setSheet(null)} /> : null}
    </>
  )
}

function PinSheet({ mode, onClose }: { mode: Exclude<SheetMode, null>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const enable = useLockStore((store) => store.enable)
  const disable = useLockStore((store) => store.disable)
  const change = useLockStore((store) => store.change)
  const verify = useLockStore((store) => store.verify)
  const [step, setStep] = useState<Step>(mode === 'enable' ? 'next' : 'current')
  const [currentPin, setCurrentPin] = useState('')
  const [nextPin, setNextPin] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useFocusTrap(true, busy ? () => undefined : onClose, ref)

  const title =
    mode === 'enable'
      ? step === 'confirm'
        ? 'Confirm your PIN'
        : 'Choose a PIN'
      : mode === 'disable'
        ? 'Turn off PIN lock'
        : step === 'current'
          ? 'Enter current PIN'
          : step === 'confirm'
            ? 'Confirm new PIN'
            : 'Choose a new PIN'

  const hint =
    mode === 'enable' && step === 'next'
      ? 'If you forget this PIN, the only way back in is to reset the app.'
      : mode === 'disable'
        ? 'Enter your PIN to turn the lock off.'
        : undefined

  const saveSettings = useCallback((next: Settings) => {
    useSettingsStore.setState({ settings: next })
  }, [])

  const submit = useCallback(
    async (value: string) => {
      if (value.length !== PIN_LENGTH || busy) return
      setBusy(true)
      setError(null)
      try {
        if (step === 'current') {
          if (mode === 'disable') {
            const next = await disable(value)
            if (!next) {
              setPin('')
              setError('That PIN does not match')
              return
            }
            saveSettings(next)
            onClose()
            return
          }
          const ok = await verify(value)
          if (!ok) {
            setPin('')
            setError('That PIN does not match')
            return
          }
          setCurrentPin(value)
          setPin('')
          setStep('next')
          return
        }
        if (step === 'next') {
          setNextPin(value)
          setPin('')
          setStep('confirm')
          return
        }
        if (value !== nextPin) {
          setPin('')
          setNextPin('')
          setError('PINs did not match. Try again.')
          setStep('next')
          return
        }
        if (mode === 'enable') {
          saveSettings(await enable(value))
        } else {
          saveSettings(await change(currentPin, value))
        }
        onClose()
      } catch (caught) {
        setPin('')
        setError(caught instanceof Error ? caught.message : 'Could not update PIN')
        if (mode === 'change') {
          setStep('current')
          setCurrentPin('')
          setNextPin('')
        }
      } finally {
        setBusy(false)
      }
    },
    [busy, change, currentPin, disable, enable, mode, nextPin, onClose, saveSettings, step, verify],
  )

  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-lg items-end bg-slate-900/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full rounded-3xl bg-white p-5 shadow-2xl outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
        <div className="mt-6">
          <PinDots filled={pin.length} error={Boolean(error)} />
        </div>
        <p className="mt-3 min-h-5 text-center text-sm text-red-600" role="alert">
          {error ?? ''}
        </p>
        <div className="mt-2">
          <PinPad
            value={pin}
            disabled={busy}
            onChange={(next) => {
              setError(null)
              setPin(next)
              if (next.length === PIN_LENGTH) void submit(next)
            }}
          />
        </div>
        <Button className="mt-4 w-full bg-slate-100 text-slate-700" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
