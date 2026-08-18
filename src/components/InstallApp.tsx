import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallBanner() {
  const { showBanner, canPrompt, ios, install, dismiss } = useInstallPrompt()
  const [guideOpen, setGuideOpen] = useState(false)

  if (!showBanner) return null

  return (
    <>
      <aside className="rounded-2xl border border-blue-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Download className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Install Finance Tracker</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Add it to your home screen for one-tap access. Data still stays on this device.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                className="px-3 py-2 text-sm"
                onClick={() => {
                  if (canPrompt) {
                    void install()
                    return
                  }
                  setGuideOpen(true)
                }}
              >
                {canPrompt ? 'Install' : 'How to install'}
              </Button>
              <Button
                className="bg-slate-100 px-3 py-2 text-sm text-slate-700"
                onClick={dismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </aside>
      {guideOpen ? <InstallGuide onClose={() => setGuideOpen(false)} ios={ios} /> : null}
    </>
  )
}

export function InstallSettingsRow() {
  const { showSettings, canPrompt, ios, install } = useInstallPrompt()
  const [guideOpen, setGuideOpen] = useState(false)

  if (!showSettings) return null

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <h2 className="px-4 pt-4 text-sm font-semibold text-slate-900">App</h2>
        <button
          type="button"
          onClick={() => {
            if (canPrompt) {
              void install()
              return
            }
            setGuideOpen(true)
          }}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700"
        >
          <span>Install app</span>
          <Download className="size-4 text-slate-400" aria-hidden />
        </button>
      </section>
      {guideOpen ? <InstallGuide onClose={() => setGuideOpen(false)} ios={ios} /> : null}
    </>
  )
}

function InstallGuide({ onClose, ios }: { onClose: () => void; ios: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-lg items-end bg-slate-900/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        className="w-full rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="install-guide-title" className="text-lg font-semibold text-slate-900">
          Add to Home Screen
        </h2>
        {ios ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>
              Tap{' '}
              <Share className="mx-0.5 inline size-4 align-text-bottom text-blue-600" aria-hidden />{' '}
              Share in Safari
            </li>
            <li>Scroll and tap Add to Home Screen</li>
            <li>Tap Add</li>
          </ol>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Open this site in Chrome or Edge on your phone</li>
            <li>Tap the browser menu</li>
            <li>Choose Install app or Add to Home screen</li>
          </ol>
        )}
        <Button className="mt-5 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  )
}
