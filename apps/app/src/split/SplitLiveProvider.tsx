import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { fetchNudges, splitWsUrl } from './api'
import { addSplitNotice, noticeCopy, maybeDesktopNotify } from './notices'
import { playNotificationSound } from './sound'
import { useSplitSessions } from './sessions'
import type { SplitRealtimeMessage, SplitSession } from './types'

type GroupHandler = (message: SplitRealtimeMessage) => void

const handlers = new Map<string, Set<GroupHandler>>()
const seenEvents = new Set<string>()

function rememberEvent(id: string) {
  if (seenEvents.has(id)) return false
  seenEvents.add(id)
  if (seenEvents.size > 80) {
    const first = seenEvents.values().next().value
    if (first) seenEvents.delete(first)
  }
  return true
}

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

function applyMessage(
  message: SplitRealtimeMessage,
  session: SplitSession,
  liveMemberId: string,
  onToast: (text: string) => void,
) {
  if (message.event === 'ping' || message.event === 'connected') return
  const eventId = message.id ?? `${message.event}:${message.toMemberId ?? ''}:${message.memberId ?? ''}:${message.group?.id ?? message.groupId ?? ''}`
  if (message.event === 'nudge' && message.id && !rememberEvent(message.id)) return
  if (message.event === 'nudge' && !message.id && !rememberEvent(eventId)) return

  const groupId = message.group?.id ?? message.groupId ?? session.groupId
  emitToGroup(groupId, message)
  const copy = noticeCopy(message, { ...session, memberId: liveMemberId })
  if (!copy) return
  void addSplitNotice({
    groupId,
    groupName: message.group?.name ?? message.groupName ?? session.groupName,
    event: message.event,
    title: copy.title,
    body: copy.body,
  })
  onToast(copy.body)
  maybeDesktopNotify(copy.title, copy.body)
  if (copy.play) playNotificationSound()
}

export function SplitLiveProvider({
  children,
  onToast,
}: {
  children: ReactNode
  onToast: (message: string) => void
}) {
  const sessions = useSplitSessions() ?? []
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions
  const key = sessions.map((row) => `${row.sessionToken}:${row.memberId}`).sort().join('|')
  const toastRef = useRef(onToast)
  toastRef.current = onToast

  useEffect(() => {
    if (key.length === 0) return
    let closed = false
    const sockets: WebSocket[] = []
    const timers: number[] = []
    const list = sessionsRef.current

    const attach = (session: SplitSession) => {
      let retry = 0
      let socket: WebSocket | null = null
      let liveMemberId = session.memberId

      const handle = (message: SplitRealtimeMessage) => {
        if (message.event === 'connected' && message.memberId) {
          liveMemberId = message.memberId
        }
        applyMessage(message, session, liveMemberId, (text) => toastRef.current(text))
      }

      const connect = () => {
        if (closed) return
        socket = new WebSocket(splitWsUrl(session.sessionToken))
        sockets.push(socket)
        socket.onmessage = (event) => {
          try {
            handle(JSON.parse(String(event.data)) as SplitRealtimeMessage)
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
      timers.push(
        window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: 'ping' }))
          }
        }, 20000),
      )
      timers.push(
        window.setInterval(() => {
          void fetchNudges(session.groupId, session.sessionToken)
            .then((result) => {
              for (const nudge of result.nudges) handle(nudge)
            })
            .catch(() => undefined)
        }, 4000),
      )
    }

    for (const session of list) attach(session)

    return () => {
      closed = true
      for (const timer of timers) {
        window.clearTimeout(timer)
        window.clearInterval(timer)
      }
      for (const socket of sockets) socket.close()
    }
  }, [key])

  return <SplitLiveContext.Provider value={{ sessions }}>{children}</SplitLiveContext.Provider>
}
