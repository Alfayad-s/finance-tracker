import { HttpError } from './errors'

export function equalShareCents(totalCents: number, memberIds: string[]) {
  if (memberIds.length === 0) {
    throw new HttpError(400, 'Equal split needs at least one member')
  }
  const base = Math.floor(totalCents / memberIds.length)
  let remainder = totalCents - base * memberIds.length
  return memberIds.map((memberId) => {
    const extra = remainder > 0 ? 1 : 0
    remainder -= extra
    return { memberId, shareCents: base + extra }
  })
}

export function customShareCents(
  totalCents: number,
  shares: { memberId: string; shareCents: number }[],
) {
  if (shares.length === 0) {
    throw new HttpError(400, 'Custom split needs at least one share')
  }
  const seen = new Set<string>()
  let sum = 0
  for (const share of shares) {
    if (seen.has(share.memberId)) {
      throw new HttpError(400, 'Each member can appear once in a custom split')
    }
    if (!Number.isInteger(share.shareCents) || share.shareCents < 0) {
      throw new HttpError(400, 'Share amounts must be non-negative integers (cents)')
    }
    seen.add(share.memberId)
    sum += share.shareCents
  }
  if (sum !== totalCents) {
    throw new HttpError(400, 'Custom shares must sum to the expense total')
  }
  return shares
}
