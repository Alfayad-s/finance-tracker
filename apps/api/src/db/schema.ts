import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const memberRoleEnum = pgEnum('member_role', ['owner', 'member'])
export const splitTypeEnum = pgEnum('split_type', ['equal', 'custom'])

export const groups = pgTable(
  'groups',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    currency: text('currency').notNull().default('INR'),
    inviteCode: text('invite_code').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('groups_invite_code_idx').on(table.inviteCode)],
)

export const members = pgTable(
  'members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    role: memberRoleEnum('role').notNull().default('member'),
    sessionTokenHash: text('session_token_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('members_session_token_hash_idx').on(table.sessionTokenHash),
    index('members_group_id_idx').on(table.groupId),
  ],
)

export const expenses = pgTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    paidByMemberId: text('paid_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    amountCents: integer('amount_cents').notNull(),
    note: text('note').notNull().default(''),
    date: text('date').notNull(),
    splitType: splitTypeEnum('split_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('expenses_group_id_idx').on(table.groupId)],
)

export const expenseShares = pgTable(
  'expense_shares',
  {
    expenseId: text('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    shareCents: integer('share_cents').notNull(),
  },
  (table) => [uniqueIndex('expense_shares_expense_member_idx').on(table.expenseId, table.memberId)],
)

export const settlements = pgTable(
  'settlements',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    fromMemberId: text('from_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    toMemberId: text('to_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    amountCents: integer('amount_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('settlements_group_id_idx').on(table.groupId)],
)
