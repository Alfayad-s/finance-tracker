import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { SplitSession } from './types'

export function useSplitSessions() {
  return useLiveQuery(() => db.splitSessions.toArray())
}

export async function saveSplitSession(session: SplitSession) {
  await db.splitSessions.put(session)
}

export async function removeSplitSession(groupId: string) {
  await db.splitSessions.delete(groupId)
}

export async function getSplitSession(groupId: string) {
  return db.splitSessions.get(groupId)
}
