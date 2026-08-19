import { useCallback, useEffect } from 'react'
import { usePrivacyStore } from '@/stores/privacyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatCompactCurrency, formatCurrency, maskCurrency } from '@/utils/currency'

export function useAmountHidden() {
  const hideAmounts = useSettingsStore((store) => store.settings?.hideAmounts === true)
  const peeked = usePrivacyStore((store) => store.peeked)
  return hideAmounts && !peeked
}

export function useHidePeekOnLeave() {
  const hidePeek = usePrivacyStore((store) => store.hidePeek)

  useEffect(() => {
    const hide = () => hidePeek()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hide()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', hide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', hide)
    }
  }, [hidePeek])
}

export function useMoneyText() {
  const hidden = useAmountHidden()

  return useCallback(
    (
      amount: number,
      currency: string,
      options?: { compact?: boolean; sign?: 'in' | 'out' },
    ) => {
      const formatted = hidden
        ? maskCurrency(currency)
        : options?.compact
          ? formatCompactCurrency(amount, currency)
          : formatCurrency(amount, currency)
      if (options?.sign === 'in') return `+${formatted}`
      if (options?.sign === 'out') return `−${formatted}`
      return formatted
    },
    [hidden],
  )
}
