import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAmountHidden, useMoneyText } from '@/hooks/useAmountPrivacy'
import { usePrivacyStore } from '@/stores/privacyStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function Amount({
  value,
  currency,
  compact,
  sign,
  className,
}: {
  value: number
  currency: string
  compact?: boolean
  sign?: 'in' | 'out'
  className?: string
}) {
  const money = useMoneyText()

  return (
    <span className={cn('tabular-nums', className)}>
      {money(value, currency, { compact, sign })}
    </span>
  )
}

export function AmountPrivacyButton({ className }: { className?: string }) {
  const hideAmounts = useSettingsStore((store) => store.settings?.hideAmounts === true)
  const hidden = useAmountHidden()
  const togglePeek = usePrivacyStore((store) => store.togglePeek)

  if (!hideAmounts) return null

  return (
    <button
      type="button"
      onClick={togglePeek}
      aria-pressed={!hidden}
      aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
      className={cn(
        'rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600',
        className,
      )}
    >
      {hidden ? <Eye className="size-5" aria-hidden /> : <EyeOff className="size-5" aria-hidden />}
    </button>
  )
}
