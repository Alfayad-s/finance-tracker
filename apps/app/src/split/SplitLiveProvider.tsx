import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { splitWsUrl } from './api'
import { addSplitNotice, noticeCopy, maybeDesktopNotify } from './notices'
import { playNotificationSound } from './sound'
import { useSplitSessions } from './sessions'
import type { SplitRealtimeMessage, SplitSession } from './types'

type GroupHandler = (message: SplitRealtimeMessage) => void

const handlers = new Map<string, Set<GroupHandler>>()

export function subscribeSplitGroup(groupId: string, handler: GroupHandler) {
  let set = handlers.get(groupId)
  if (!set) {
    set = new Set()
    handlers.set(groupId, set)
  }
  set.add(handler)
  return () => {
    set.delete(handler)
    if (set.size === 0) handlers.delete(groupId)
  }
}

function emitToGroup(groupId: string, message: SplitRealtimeMessage) {
  const set = handlers.get(groupId)
  if (!set) return
  for (const handler of set) handler(message)
}

const SplitLiveContext = createContext<{ sessions: SplitSession[] }>({ sessions: [] })

export function useSplitLive() {
  return useContext(SplitLiveContext)
}

export function SplitLiveProvider({
  children,
  onToast,
}: {
  children: ReactNode
  onToast: (message: string) => void
}) {
  const sessions = useSplitSessions() ?? []
  const sessionMap = useMemo(() => new Map(sessions.map((row) => [row.sessionToken, row])), [sessions])
  const key = sessions.map((row) => row.sessionToken).sort().join('|')
  const toastRef = useRef(onToast)
  toastRef.current = onToast

  useEffect(() => {
    if (key.length === 0) return
    let closed = false
    const sockets: WebSocket[] = []
    const timers: number[] = []
    const list = [...sessionMap.values()]

    const attach = (session: SplitSession) => {
      let retry = 0
      let socket: WebSocket | null = null

      const connect = () => {
        if (closed) return
        socket = new WebSocket(splitWsUrl(session.sessionToken))
        sockets.push(socket)
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(String(event.data)) as SplitRealtimeMessage
            const groupId = message.group?.id ?? message.groupId ?? session.groupId
            emitToGroup(groupId, message)
            if (message.event === 'connected') return
            const copy = noticeCopy(message, session)
            if (!copy) return
            void addSplitNotice({
              groupId,
              groupName: message.group?.name ?? message.groupName ?? session.groupName,
              event: message.event,
              title: copy.title,
              body: copy.body,
            })
            toastRef.current(copy.body)
            maybeDesktopNotify(copy.title, copy.body)
            if (copy.play) playNotificationSound()
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
          timers.push(window.setTimeout(connect, wait))
        }
      }

      connect()
    }

    for (const session of list) attach(session)

    return () => {
      closed = true
      for (const timer of timers) window.clearTimeout(timer)
      for (const socket of sockets) socket.close()
    }
  }, [key, sessionMap])

  return <SplitLiveContext.Provider value={{ sessions }}>{children}</SplitLiveContext.Provider>
}
