import { useEffect, useRef } from 'react'
import { splitWsUrl } from './api'
import type { SplitRealtimeMessage } from './types'

export function useSplitRealtime(
  token: string | undefined,
  onMessage: (message: SplitRealtimeMessage) => void,
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!token) return

    let closed = false
    let socket: WebSocket | null = null
    let retry = 0
    let timer: number | undefined

    const connect = () => {
      if (closed) return
      socket = new WebSocket(splitWsUrl(token))
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as SplitRealtimeMessage
          onMessageRef.current(message)
        } catch {
          /* ignore */
        }
      }
      socket.onopen = () => {
        retry = 0
      }
      socket.onclose = () => {
        if (closed) return
        retry += 1
        const wait = Math.min(8000, 500 * 2 ** Math.min(retry, 4))
        timer = window.setTimeout(connect, wait)
      }
    }

    connect()

    return () => {
      closed = true
      window.clearTimeout(timer)
      socket?.close()
    }
  }, [token])
}
