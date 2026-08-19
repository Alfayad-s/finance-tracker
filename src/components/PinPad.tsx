import { useEffect } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PIN_LENGTH } from '@/utils/pin'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const

export function PinDots({ filled, error }: { filled: number; error?: boolean }) {
  return (
    <div
      className="flex justify-center gap-3"
      role="img"
      aria-label={`${filled} of ${PIN_LENGTH} digits entered`}
    >
      {Array.from({ length: PIN_LENGTH }, (_, index) => (
        <span
          key={index}
          className={cn(
            'size-3.5 rounded-full border-2 transition-colors',
            index < filled
              ? error
                ? 'border-red-500 bg-red-500'
                : 'border-blue-600 bg-blue-600'
              : 'border-slate-300 bg-white',
          )}
        />
      ))}
    </div>
  )
}

export function PinPad({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled?: boolean
  onChange: (next: string) => void
}) {
  useEffect(() => {
    if (disabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        onChange((value + event.key).slice(0, PIN_LENGTH))
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        onChange(value.slice(0, -1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, onChange, value])

  return (
    <div className="mx-auto grid w-full max-w-[18rem] grid-cols-3 gap-3" role="group" aria-label="PIN keypad">
      {KEYS.map((key, index) => {
        if (!key) {
          return <span key={`empty-${index}`} />
        }
        if (key === 'back') {
          return (
            <button
              key="back"
              type="button"
              aria-label="Delete last digit"
              disabled={disabled || value.length === 0}
              onClick={() => onChange(value.slice(0, -1))}
              className="flex h-14 items-center justify-center rounded-2xl text-slate-700 transition-[opacity,transform] hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
            >
              <Delete className="size-6" aria-hidden />
            </button>
          )
        }
        return (
          <button
            key={key}
            type="button"
            disabled={disabled || value.length >= PIN_LENGTH}
            onClick={() => onChange((value + key).slice(0, PIN_LENGTH))}
            className="h-14 rounded-2xl text-2xl font-medium text-slate-900 transition-[opacity,transform] hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}
