export type SplitRole = 'owner' | 'member'
export type SplitType = 'equal' | 'custom'

export interface SplitMember {
  id: string
  displayName: string
  role: SplitRole
  leftAt?: string | Date | null
  createdAt: string
}

export interface SplitShare {
  memberId: string
  shareCents: number
}

export interface SplitExpense {
  id: string
  paidByMemberId: string
  amountCents: number
  note: string
  date: string
  splitType: SplitType
  createdAt: string
  shares: SplitShare[]
}

export interface SplitSettlement {
  id: string
  fromMemberId: string
  toMemberId: string
  amountCents: number
  createdAt: string
}

export interface SplitBalance {
  memberId: string
  netCents: number
}

export interface SplitTransfer {
  fromMemberId: string
  toMemberId: string
  amountCents: number
}

export interface SplitGroup {
  id: string
  name: string
  currency: string
  inviteCode: string
  createdAt: string
  members: SplitMember[]
  balances: SplitBalance[]
  simplified: SplitTransfer[]
  expenses: SplitExpense[]
  settlements: SplitSettlement[]
}

export interface SplitSession {
  groupId: string
  sessionToken: string
  memberId: string
  displayName: string
  groupName: string
}

export interface SplitRealtimeMessage {
  event: string
  id?: string
  group?: SplitGroup
  memberId?: string
  displayName?: string
  groupId?: string
  fromMemberId?: string
  toMemberId?: string
  groupName?: string
  rejoined?: boolean
}

export interface SplitNotice {
  id: string
  groupId: string
  groupName: string
  event: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface AuthGroupResponse {
  sessionToken: string
  memberId: string
  group: SplitGroup
}
