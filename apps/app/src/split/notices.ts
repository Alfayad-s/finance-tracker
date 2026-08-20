import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { SplitNotice, SplitRealtimeMessage, SplitSession } from './types'

export function useSplitNotices() {
  return useLiveQuery(() => db.splitNotices.orderBy('createdAt').reverse().toArray())
}

export async function addSplitNotice(notice: Omit<SplitNotice, 'id' | 'read' | 'createdAt'> & { id?: string }) {
  await db.splitNotices.put({
    id: notice.id ?? crypto.randomUUID(),
    groupId: notice.groupId,
    groupName: notice.groupName,
    event: notice.event,
    title: notice.title,
    body: notice.body,
    read: false,
    createdAt: new Date().toISOString(),
  })
}

export async function markNoticeRead(id: string) {
  await db.splitNotices.update(id, { read: true })
}

export async function markAllNoticesRead() {
  const unread = await db.splitNotices.filter((notice) => !notice.read).toArray()
  if (unread.length === 0) return
  await db.splitNotices.bulkPut(unread.map((notice) => ({ ...notice, read: true })))
}

export function noticeCopy(
  message: SplitRealtimeMessage,
  session: SplitSession,
): { title: string; body: string; play: boolean } | null {
  const groupName = message.group?.name ?? message.groupName ?? session.groupName
  const groupId = message.group?.id ?? message.groupId ?? session.groupId
  if (!groupId) return null

  if (message.event === 'nudge') {
    const mine = message.toMemberId === session.memberId
    if (!mine) return null
    return {
      title: 'Someone is calling you',
      body: `${message.displayName ?? 'A friend'} wants your attention in ${groupName}`,
      play: true,
    }
  }

  if (message.event === 'member_joined') {
    if (!message.displayName || message.memberId === session.memberId) return null
    return {
      title: message.rejoined ? 'Someone is back' : 'Someone joined',
      body: `${message.displayName} ${message.rejoined ? 'rejoined' : 'joined'} ${groupName}`,
      play: true,
    }
  }

  if (message.event === 'member_left') {
    if (!message.displayName || message.memberId === session.memberId) return null
    return {
      title: 'Someone left',
      body: `${message.displayName} left ${groupName}`,
      play: true,
    }
  }

  if (message.event === 'expense_added') {
    const last = message.group?.expenses.at(-1)
    if (last?.paidByMemberId === session.memberId) return null
    return {
      title: 'New shared expense',
      body: `A bill was added in ${groupName}`,
      play: true,
    }
  }

  if (message.event === 'settlement_added') {
    const last = message.group?.settlements.at(-1)
    if (last?.fromMemberId === session.memberId) return null
    return {
      title: 'Settle-up recorded',
      body: `A payment was recorded in ${groupName}`,
      play: true,
    }
  }

  if (message.event === 'expense_deleted') {
    return {
      title: 'Expense removed',
      body: `An expense was deleted in ${groupName}`,
      play: false,
    }
  }

  return null
}

export function maybeDesktopNotify(title: string, body: string) {
  if (document.visibilityState === 'visible') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, silent: true })
  } catch {
    /* ignore */
  }
}
