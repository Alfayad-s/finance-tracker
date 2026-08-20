import type { AuthGroupResponse, SplitGroup } from './types'

const base = (import.meta.env.VITE_SPLIT_API_URL ?? 'http://localhost:8787').replace(/\/$/, '')

export function splitWsUrl(token: string) {
  const http = base.startsWith('https') ? base.replace(/^https/, 'wss') : base.replace(/^http/, 'ws')
  return `${http}/ws?token=${encodeURIComponent(token)}`
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<T> {
  const { method = 'GET', token, body } = options
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Could not reach the split server. Start the api with npm run dev from the repo root.')
  }

  const data = (await response.json().catch(() => null)) as { error?: string } | T | null
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Request failed'
    throw new Error(message)
  }
  return data as T
}

export function createGroup(body: { name: string; displayName: string; currency?: string }) {
  return request<AuthGroupResponse>('/groups', { method: 'POST', body })
}

export function joinGroup(body: { inviteCode: string; displayName: string }) {
  return request<AuthGroupResponse>('/join', { method: 'POST', body })
}

export function fetchGroup(groupId: string, token: string) {
  return request<{ memberId: string; group: SplitGroup }>(`/groups/${groupId}`, { token })
}

export function addExpense(
  groupId: string,
  token: string,
  body: {
    amountCents: number
    splitType: 'equal' | 'custom'
    paidByMemberId?: string
    memberIds?: string[]
    shares?: { memberId: string; shareCents: number }[]
    note?: string
    date?: string
  },
) {
  return request<{ group: SplitGroup }>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    token,
    body,
  })
}

export function deleteExpense(groupId: string, token: string, expenseId: string) {
  return request<{ group: SplitGroup }>(`/groups/${groupId}/expenses/${expenseId}`, {
    method: 'DELETE',
    token,
  })
}

export function addSettlement(
  groupId: string,
  token: string,
  body: { fromMemberId: string; toMemberId: string; amountCents: number },
) {
  return request<{ group: SplitGroup }>(`/groups/${groupId}/settlements`, {
    method: 'POST',
    token,
    body,
  })
}

export function updateGroup(
  groupId: string,
  token: string,
  body: { name?: string; rotateInvite?: boolean },
) {
  return request<{ group: SplitGroup }>(`/groups/${groupId}`, { method: 'PATCH', token, body })
}

export function leaveGroup(groupId: string, token: string) {
  return request<{ group: SplitGroup }>(`/groups/${groupId}/leave`, { method: 'POST', token })
}

export function inviteJoinPath(code: string) {
  return `/splits/join?code=${encodeURIComponent(code)}`
}

export function parseInvitePayload(raw: string) {
  const text = raw.trim()
  try {
    const url = new URL(text)
    const code = url.searchParams.get('code')
    if (code) return code.toUpperCase()
  } catch {
    /* not a URL */
  }
  const match = text.match(/[A-Z0-9]{8}/i)
  return (match?.[0] ?? text).toUpperCase()
}

export function rupeesToCents(value: string) {
  const amount = Number(value.replace(/,/g, '').trim())
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round(amount * 100)
}

export function centsToAmount(cents: number) {
  return cents / 100
}
