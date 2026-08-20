import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import { db } from '../db/client'
import { expenseShares, expenses, groups, members, settlements } from '../db/schema'
import { netBalances, simplifyDebts } from '../lib/balances'
import { hashToken, newId, newInviteCode, newSessionToken } from '../lib/crypto'
import { HttpError } from '../lib/errors'
import { customShareCents, equalShareCents } from '../lib/splits'
import { requireGroupAccess, requireMember, type AuthedMember } from '../middleware/auth'
import { publish } from '../realtime'

type AppEnv = { Variables: { member: AuthedMember } }

function parseDisplayName(value: unknown) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'displayName is required')
  }
  const displayName = value.trim()
  if (displayName.length < 1 || displayName.length > 40) {
    throw new HttpError(400, 'displayName must be 1–40 characters')
  }
  return displayName
}

function parseGroupName(value: unknown) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'name is required')
  }
  const name = value.trim()
  if (name.length < 1 || name.length > 80) {
    throw new HttpError(400, 'name must be 1–80 characters')
  }
  return name
}

function parseCurrency(value: unknown) {
  if (value === undefined || value === null || value === '') return 'INR'
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) {
    throw new HttpError(400, 'currency must be a 3-letter code')
  }
  return value
}

function parsePositiveCents(value: unknown, label: string) {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new HttpError(400, `${label} must be a positive integer (cents)`)
  }
  return value as number
}

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const inviteCode = newInviteCode()
    const existing = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.inviteCode, inviteCode))
      .limit(1)
    if (existing.length === 0) return inviteCode
  }
  throw new HttpError(500, 'Could not create an invite code')
}

function samePersonName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

async function groupPayload(groupId: string) {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)
  if (!group) throw new HttpError(404, 'Group not found')

  const groupMembers = await db.select().from(members).where(eq(members.groupId, groupId))
  const memberIds = groupMembers.map((row) => row.id)
  const groupExpenses = await db.select().from(expenses).where(eq(expenses.groupId, groupId))
  const expenseIds = groupExpenses.map((row) => row.id)
  const shares =
    expenseIds.length === 0
      ? []
      : await db.select().from(expenseShares).where(inArray(expenseShares.expenseId, expenseIds))
  const groupSettlements = await db.select().from(settlements).where(eq(settlements.groupId, groupId))

  const balances = netBalances(
    memberIds,
    groupExpenses.map((row) => ({ paidByMemberId: row.paidByMemberId, amountCents: row.amountCents })),
    shares.map((row) => ({ memberId: row.memberId, shareCents: row.shareCents })),
    groupSettlements.map((row) => ({
      fromMemberId: row.fromMemberId,
      toMemberId: row.toMemberId,
      amountCents: row.amountCents,
    })),
  )

  const visibleMembers = groupMembers.filter((row) => {
    if (!row.leftAt) return true
    const twin = groupMembers.find(
      (other) => !other.leftAt && other.id !== row.id && samePersonName(other.displayName, row.displayName),
    )
    if (!twin) return true
    const leftNet = balances.find((item) => item.memberId === row.id)?.netCents ?? 0
    return leftNet !== 0
  })
  const visibleIds = new Set(visibleMembers.map((row) => row.id))
  const visibleBalances = balances.filter((row) => visibleIds.has(row.memberId))

  return {
    id: group.id,
    name: group.name,
    currency: group.currency,
    inviteCode: group.inviteCode,
    createdAt: group.createdAt,
    members: visibleMembers.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      role: row.role,
      leftAt: row.leftAt,
      createdAt: row.createdAt,
    })),
    balances: visibleBalances,
    simplified: simplifyDebts(visibleBalances),
    expenses: groupExpenses.map((row) => ({
      id: row.id,
      paidByMemberId: row.paidByMemberId,
      amountCents: row.amountCents,
      note: row.note,
      date: row.date,
      splitType: row.splitType,
      createdAt: row.createdAt,
      shares: shares
        .filter((share) => share.expenseId === row.id)
        .map((share) => ({ memberId: share.memberId, shareCents: share.shareCents })),
    })),
    settlements: groupSettlements.map((row) => ({
      id: row.id,
      fromMemberId: row.fromMemberId,
      toMemberId: row.toMemberId,
      amountCents: row.amountCents,
      createdAt: row.createdAt,
    })),
  }
}

async function emitGroup(
  groupId: string,
  event: string,
  extra: Record<string, unknown> = {},
) {
  const group = await groupPayload(groupId)
  publish(groupId, { event, group, ...extra })
  return group
}

export const groupsRoute = new Hono<AppEnv>()

groupsRoute.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required')
  }
  const name = parseGroupName((body as { name?: unknown }).name)
  const displayName = parseDisplayName((body as { displayName?: unknown }).displayName)
  const currency = parseCurrency((body as { currency?: unknown }).currency)

  const groupId = newId()
  const memberId = newId()
  const sessionToken = newSessionToken()
  const inviteCode = await uniqueInviteCode()

  await db.transaction(async (tx) => {
    await tx.insert(groups).values({ id: groupId, name, currency, inviteCode })
    await tx.insert(members).values({
      id: memberId,
      groupId,
      displayName,
      role: 'owner',
      sessionTokenHash: hashToken(sessionToken),
    })
  })

  return c.json({
    sessionToken,
    memberId,
    group: await groupPayload(groupId),
  }, 201)
})

export async function joinGroup(c: Context) {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required')
  }
  const inviteCode =
    typeof (body as { inviteCode?: unknown }).inviteCode === 'string'
      ? (body as { inviteCode: string }).inviteCode.trim().toUpperCase()
      : ''
  if (!inviteCode) {
    throw new HttpError(400, 'inviteCode is required')
  }
  const displayName = parseDisplayName((body as { displayName?: unknown }).displayName)

  const [found] = await db.select().from(groups).where(eq(groups.inviteCode, inviteCode)).limit(1)
  if (!found) {
    throw new HttpError(404, 'Invite code not found')
  }

  const existing = await db.select().from(members).where(eq(members.groupId, found.id))
  const sameName = existing.filter((row) => samePersonName(row.displayName, displayName))
  const active = sameName.find((row) => !row.leftAt)
  const leftover = [...sameName]
    .filter((row) => row.leftAt)
    .sort((a, b) => new Date(b.leftAt ?? 0).getTime() - new Date(a.leftAt ?? 0).getTime())[0]

  const sessionToken = newSessionToken()
  let memberId: string

  if (active) {
    memberId = active.id
    await db
      .update(members)
      .set({ sessionTokenHash: hashToken(sessionToken), displayName })
      .where(eq(members.id, active.id))
  } else if (leftover) {
    memberId = leftover.id
    await db
      .update(members)
      .set({
        leftAt: null,
        role: leftover.role === 'owner' ? 'member' : leftover.role,
        sessionTokenHash: hashToken(sessionToken),
        displayName,
      })
      .where(eq(members.id, leftover.id))
  } else {
    memberId = newId()
    await db.insert(members).values({
      id: memberId,
      groupId: found.id,
      displayName,
      role: 'member',
      sessionTokenHash: hashToken(sessionToken),
    })
  }

  const group = await emitGroup(found.id, 'member_joined', {
    memberId,
    displayName,
  })

  return c.json(
    {
      sessionToken,
      memberId,
      group,
    },
    201,
  )
}

groupsRoute.get('/', requireMember, async (c) => {
  const member = c.get('member')
  const [group] = await db
    .select({
      id: groups.id,
      name: groups.name,
      currency: groups.currency,
      inviteCode: groups.inviteCode,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .where(eq(groups.id, member.groupId))
    .limit(1)

  return c.json({
    groups: group
      ? [
          {
            ...group,
            memberId: member.id,
            displayName: member.displayName,
            role: member.role,
          },
        ]
      : [],
  })
})

groupsRoute.use('/:id', requireMember)
groupsRoute.use('/:id/*', requireMember)

groupsRoute.get('/:id', async (c) => {
  const member = c.get('member')
  const groupId = c.req.param('id')
  requireGroupAccess(member, groupId)
  return c.json({
    memberId: member.id,
    group: await groupPayload(groupId),
  })
})

groupsRoute.patch('/:id', async (c) => {
  const member = c.get('member')
  const groupId = c.req.param('id')
  requireGroupAccess(member, groupId)
  if (member.role !== 'owner') {
    throw new HttpError(403, 'Only the owner can update this group')
  }

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required')
  }

  const patch: { name?: string; inviteCode?: string } = {}
  if ('name' in body) {
    patch.name = parseGroupName((body as { name: unknown }).name)
  }
  if ((body as { rotateInvite?: unknown }).rotateInvite === true) {
    patch.inviteCode = await uniqueInviteCode()
  }
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'Provide name and/or rotateInvite')
  }

  await db.update(groups).set(patch).where(eq(groups.id, groupId))
  return c.json({ group: await emitGroup(groupId, 'group_updated') })
})

groupsRoute.post('/:id/leave', async (c) => {
  const member = c.get('member')
  const groupId = c.req.param('id')
  requireGroupAccess(member, groupId)

  if (member.role === 'owner') {
    const [nextOwner] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.groupId, groupId), isNull(members.leftAt), ne(members.id, member.id)))
      .orderBy(asc(members.createdAt))
      .limit(1)
    if (nextOwner) {
      await db.update(members).set({ role: 'owner' }).where(eq(members.id, nextOwner.id))
    }
  }

  await db
    .update(members)
    .set({
      leftAt: new Date(),
      sessionTokenHash: hashToken(newSessionToken()),
    })
    .where(eq(members.id, member.id))

  const group = await emitGroup(groupId, 'member_left', {
    memberId: member.id,
    displayName: member.displayName,
  })
  return c.json({ group })
})

groupsRoute.post('/:id/expenses', async (c) => {
  const member = c.get('member')
  const groupId = c.req.param('id')
  requireGroupAccess(member, groupId)

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required')
  }

  const amountCents = parsePositiveCents((body as { amountCents?: unknown }).amountCents, 'amountCents')
  const paidByMemberId =
    typeof (body as { paidByMemberId?: unknown }).paidByMemberId === 'string'
      ? (body as { paidByMemberId: string }).paidByMemberId
      : member.id
  const splitType = (body as { splitType?: unknown }).splitType
  if (splitType !== 'equal' && splitType !== 'custom') {
    throw new HttpError(400, 'splitType must be equal or custom')
  }
  const note =
    typeof (body as { note?: unknown }).note === 'string' ? (body as { note: string }).note.trim() : ''
  if (note.length > 200) {
    throw new HttpError(400, 'note must be 200 characters or fewer')
  }
  const date =
    typeof (body as { date?: unknown }).date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test((body as { date: string }).date)
      ? (body as { date: string }).date
      : new Date().toISOString().slice(0, 10)

  const groupMembers = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.groupId, groupId), isNull(members.leftAt)))
  const memberIds = new Set(groupMembers.map((row) => row.id))
  if (!memberIds.has(paidByMemberId)) {
    throw new HttpError(400, 'paidByMemberId is not in this group')
  }

  let shares: { memberId: string; shareCents: number }[]
  if (splitType === 'equal') {
    const ids =
      Array.isArray((body as { memberIds?: unknown }).memberIds) &&
      (body as { memberIds: unknown[] }).memberIds.length > 0
        ? (body as { memberIds: unknown[] }).memberIds
        : groupMembers.map((row) => row.id)
    if (!ids.every((id) => typeof id === 'string' && memberIds.has(id))) {
      throw new HttpError(400, 'memberIds must be people in this group')
    }
    const uniqueIds = [...new Set(ids as string[])]
    shares = equalShareCents(amountCents, uniqueIds)
  } else {
    const raw = (body as { shares?: unknown }).shares
    if (!Array.isArray(raw)) {
      throw new HttpError(400, 'shares is required for a custom split')
    }
    const parsed = raw.map((item) => {
      if (!item || typeof item !== 'object') {
        throw new HttpError(400, 'Each share needs memberId and shareCents')
      }
      const row = item as { memberId?: unknown; shareCents?: unknown }
      if (typeof row.memberId !== 'string' || !memberIds.has(row.memberId)) {
        throw new HttpError(400, 'Each share memberId must be in this group')
      }
      if (!Number.isInteger(row.shareCents)) {
        throw new HttpError(400, 'shareCents must be an integer')
      }
      return { memberId: row.memberId, shareCents: row.shareCents as number }
    })
    shares = customShareCents(amountCents, parsed)
  }

  const expenseId = newId()
  await db.transaction(async (tx) => {
    await tx.insert(expenses).values({
      id: expenseId,
      groupId,
      paidByMemberId,
      amountCents,
      note,
      date,
      splitType,
    })
    await tx.insert(expenseShares).values(
      shares.map((share) => ({
        expenseId,
        memberId: share.memberId,
        shareCents: share.shareCents,
      })),
    )
  })

  return c.json({ group: await emitGroup(groupId, 'expense_added') }, 201)
})

groupsRoute.delete('/:id/expenses/:eid', async (c) => {
  const member = c.get('member')
  const groupId = c.req.param('id')
  const expenseId = c.req.param('eid')
  requireGroupAccess(member, groupId)

  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1)
  if (!expense) {
    throw new HttpError(404, 'Expense not found')
  }
  if (member.role !== 'owner' && member.id !== expense.paidByMemberId) {
    throw new HttpError(403, 'Only the payer or owner can delete this expense')
  }

  await db.delete(expenses).where(eq(expenses.id, expenseId))
  return c.json({ group: await emitGroup(groupId, 'expense_deleted') })
})

groupsRoute.post('/:id/settlements', async (c) => {
  const member = c.get('member')
  const groupId = c.req.param('id')
  requireGroupAccess(member, groupId)

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'JSON body is required')
  }

  const amountCents = parsePositiveCents((body as { amountCents?: unknown }).amountCents, 'amountCents')
  const fromMemberId = (body as { fromMemberId?: unknown }).fromMemberId
  const toMemberId = (body as { toMemberId?: unknown }).toMemberId
  if (typeof fromMemberId !== 'string' || typeof toMemberId !== 'string') {
    throw new HttpError(400, 'fromMemberId and toMemberId are required')
  }
  if (fromMemberId === toMemberId) {
    throw new HttpError(400, 'A settlement needs two different people')
  }

  const groupMembers = await db.select({ id: members.id }).from(members).where(eq(members.groupId, groupId))
  const memberIds = new Set(groupMembers.map((row) => row.id))
  if (!memberIds.has(fromMemberId) || !memberIds.has(toMemberId)) {
    throw new HttpError(400, 'Both people must be in this group')
  }

  const settlementId = newId()
  await db.insert(settlements).values({
    id: settlementId,
    groupId,
    fromMemberId,
    toMemberId,
    amountCents,
  })

  return c.json({ group: await emitGroup(groupId, 'settlement_added') }, 201)
})
