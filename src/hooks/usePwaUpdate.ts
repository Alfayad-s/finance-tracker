import { useCallback, useEffect, useState } from 'react'
import { applyPwaUpdate, subscribePwaUpdate } from '@/pwa/register'

export function usePwaUpdate() {
  const [available, setAvailable] = useState(false)

  useEffect(() => subscribePwaUpdate(setAvailable), [])

  const update = useCallback(() => {
    void applyPwaUpdate()
  }, [])

  return { available, update }
}
