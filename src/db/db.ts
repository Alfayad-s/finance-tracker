import { Dexie, type EntityTable } from 'dexie'
import type { Budget, Category, Goal, MonthlyReview, RecurringRule, Settings, Transaction } from '@/types'
import { DB_NAME } from './constants'

export const db = new Dexie(DB_NAME) as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  budgets: EntityTable<Budget, 'id'>
  goals: EntityTable<Goal, 'id'>
  settings: EntityTable<Settings, 'id'>
  recurringRules: EntityTable<RecurringRule, 'id'>
  monthlyReviews: EntityTable<MonthlyReview, 'id'>
}

db.version(1).stores({
  transactions:
    'id, type, categoryId, date, createdAt, [type+date], [categoryId+date]',
  categories: 'id, type, order',
  budgets: 'id, month, categoryId, [month+categoryId]',
  goals: 'id, createdAt',
  settings: 'id',
})

db.version(2).stores({
  transactions:
    'id, type, categoryId, date, createdAt, recurringId, [type+date], [categoryId+date]',
  recurringRules: 'id, categoryId, nextDate, createdAt',
})

db.version(3).stores({
  monthlyReviews: 'id, month, completedAt',
})
