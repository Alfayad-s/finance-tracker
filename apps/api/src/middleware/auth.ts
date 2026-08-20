import { eq } from 'drizzle-orm'
import type { MiddlewareHandler } from 'hono'
import { db } from '../db/client'
import { members } from '../db/schema'
import { hashToken } from '../lib/crypto'
import { HttpError } from '../lib/errors'

export type AuthedMember = {
  id: string
  groupId: string
  displayName: string
  role: 'owner' | 'member'
}

export async function findMemberByToken(token: string): Promise<AuthedMember | null> {
  if (!token) return null
  const [member] = await db
    .select({
      id: members.id,
      groupId: members.groupId,
      displayName: members.displayName,
      role: members.role,
    })
    .from(members)
    .where(eq(members.sessionTokenHash, hashToken(token)))
    .limit(1)
  return member ?? null
}

export const requireMember: MiddlewareHandler<{
  Variables: { member: AuthedMember }
}> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const member = await findMemberByToken(token)
  if (!member) {
    throw new HttpError(401, token ? 'Invalid session token' : 'Missing session token')
  }

  c.set('member', member)
  await next()
}

export function requireGroupAccess(member: AuthedMember, groupId: string) {
  if (member.groupId !== groupId) {
    throw new HttpError(403, 'This session cannot access that group')
  }
}
