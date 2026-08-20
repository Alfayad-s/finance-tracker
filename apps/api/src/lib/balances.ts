type ExpenseRow = {
  paidByMemberId: string
  amountCents: number
}

type ShareRow = {
  memberId: string
  shareCents: number
}

type SettlementRow = {
  fromMemberId: string
  toMemberId: string
  amountCents: number
}

export function netBalances(
  memberIds: string[],
  expenses: ExpenseRow[],
  shares: ShareRow[],
  settlements: SettlementRow[],
) {
  const net = new Map(memberIds.map((id) => [id, 0]))

  for (const expense of expenses) {
    net.set(expense.paidByMemberId, (net.get(expense.paidByMemberId) ?? 0) + expense.amountCents)
  }
  for (const share of shares) {
    net.set(share.memberId, (net.get(share.memberId) ?? 0) - share.shareCents)
  }
  for (const settlement of settlements) {
    net.set(settlement.fromMemberId, (net.get(settlement.fromMemberId) ?? 0) + settlement.amountCents)
    net.set(settlement.toMemberId, (net.get(settlement.toMemberId) ?? 0) - settlement.amountCents)
  }

  return memberIds.map((memberId) => ({ memberId, netCents: net.get(memberId) ?? 0 }))
}

export function simplifyDebts(balances: { memberId: string; netCents: number }[]) {
  const debtors = balances
    .filter((row) => row.netCents < 0)
    .map((row) => ({ memberId: row.memberId, remaining: -row.netCents }))
    .sort((a, b) => b.remaining - a.remaining)
  const creditors = balances
    .filter((row) => row.netCents > 0)
    .map((row) => ({ memberId: row.memberId, remaining: row.netCents }))
    .sort((a, b) => b.remaining - a.remaining)

  const transfers: { fromMemberId: string; toMemberId: string; amountCents: number }[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!
    const creditor = creditors[j]!
    const amount = Math.min(debtor.remaining, creditor.remaining)
    if (amount > 0) {
      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountCents: amount,
      })
    }
    debtor.remaining -= amount
    creditor.remaining -= amount
    if (debtor.remaining === 0) i += 1
    if (creditor.remaining === 0) j += 1
  }
  return transfers
}
