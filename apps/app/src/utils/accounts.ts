import type { Account, CardThemeId, Transaction } from '@/types'

export const CARD_THEMES: {
  id: CardThemeId
  label: string
  className: string
  dark: boolean
}[] = [
  { id: 'mist', label: 'Mist', className: 'bg-neutral-100 text-neutral-700', dark: false },
  { id: 'night', label: 'Night', className: 'bg-slate-800 text-slate-100', dark: true },
  { id: 'navy', label: 'Navy', className: 'bg-blue-950 text-blue-50', dark: true },
  { id: 'stone', label: 'Stone', className: 'bg-zinc-200 text-zinc-800', dark: false },
  { id: 'forest', label: 'Forest', className: 'bg-emerald-950 text-emerald-50', dark: true },
  { id: 'wine', label: 'Wine', className: 'bg-rose-950 text-rose-50', dark: true },
  { id: 'gold', label: 'Gold', className: 'bg-amber-200 text-amber-950', dark: false },
  { id: 'carbon', label: 'Carbon', className: 'bg-zinc-900 text-zinc-100', dark: true },
]

export function defaultThemeFor(type: Account['type']): CardThemeId {
  if (type === 'credit') return 'navy'
  if (type === 'cash') return 'stone'
  return 'mist'
}

export function themeOf(account: Account) {
  return CARD_THEMES.find((theme) => theme.id === account.theme) ?? CARD_THEMES[0]
}

export function accountKindLabel(type: Account['type']) {
  if (type === 'credit') return 'Credit card'
  if (type === 'cash') return 'Cash'
  return 'Bank account'
}

export function currentBalance(account: Account, transactions: Transaction[]) {
  let signed = 0
  for (const row of transactions) {
    if (row.accountId === account.id) {
      signed += row.type === 'income' ? row.amount : -row.amount
    }
    if (row.transferToAccountId === account.id) {
      signed += row.amount
    }
  }
  if (account.type === 'credit') {
    return account.openingBalance - signed
  }
  return account.openingBalance + signed
}

export function signedMovement(account: Account, transactions: Transaction[]) {
  let signed = 0
  for (const row of transactions) {
    if (row.accountId === account.id) {
      signed += row.type === 'income' ? row.amount : -row.amount
    }
    if (row.transferToAccountId === account.id) {
      signed += row.amount
    }
  }
  return signed
}

export function openingForCurrentBalance(
  account: Account,
  transactions: Transaction[],
  target: number,
) {
  const signed = signedMovement(account, transactions)
  if (account.type === 'credit') return target + signed
  return target - signed
}

export function availableCredit(account: Account, transactions: Transaction[]) {
  if (account.type !== 'credit' || !account.creditLimit) return null
  return Math.max(0, account.creditLimit - currentBalance(account, transactions))
}

export function netWorth(accounts: Account[], transactions: Transaction[]) {
  return accounts.reduce((total, account) => {
    const balance = currentBalance(account, transactions)
    return account.type === 'credit' ? total - balance : total + balance
  }, 0)
}
