import type { RecurringRule, Transaction } from '@/types'
import { todayISO } from '@/utils/date'
import { nextOccurrence } from '@/utils/recurring'
import { db } from './db'

const MAX_OCCURRENCES_PER_RULE = 400

export async function generateDueRecurringTransactions(
  today = todayISO(),
): Promise<number> {
  const rules = await db.recurringRules.toArray()
  let created = 0

  for (const rule of rules) {
    if (!rule.active) continue
    created += await materializeRule(rule, today)
  }

  return created
}

async function materializeRule(rule: RecurringRule, today: string): Promise<number> {
  let next = rule.nextDate
  let created = 0
  let iterations = 0
  const now = new Date().toISOString()

  await db.transaction('rw', db.recurringRules, db.transactions, async () => {
    while (
      next <= today &&
      (!rule.endDate || next <= rule.endDate) &&
      iterations < MAX_OCCURRENCES_PER_RULE
    ) {
      const already = await db.transactions
        .where('recurringId')
        .equals(rule.id)
        .filter((transaction) => transaction.date === next)
        .first()

      if (!already) {
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          type: rule.type,
          amount: rule.amount,
          categoryId: rule.categoryId,
          date: next,
          note: rule.note,
          isRecurring: true,
          recurringId: rule.id,
          createdAt: now,
          updatedAt: now,
        }
        await db.transactions.add(transaction)
        created += 1
      }

      const advanced = nextOccurrence(next, rule.frequency)
      if (advanced <= next) break
      next = advanced
      iterations += 1
    }

    const ended = Boolean(rule.endDate && next > rule.endDate)
    await db.recurringRules.update(rule.id, {
      nextDate: next,
      active: ended ? false : rule.active,
      updatedAt: now,
    })
  })

  return created
}
