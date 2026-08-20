import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { InviteQr } from '@/components/split/InviteQr'
import { SplitSheet } from '@/components/split/SplitSheet'
import { formatCurrency } from '@/utils/currency'
import { todayISO } from '@/utils/date'
import {
  addExpense,
  addSettlement,
  centsToAmount,
  deleteExpense,
  fetchGroup,
  leaveGroup,
  rupeesToCents,
} from '@/split/api'
import { getSplitSession, removeSplitSession, saveSplitSession } from '@/split/sessions'
import { useSplitRealtime } from '@/split/useSplitRealtime'
import type { SplitGroup, SplitSession } from '@/split/types'

function memberName(group: SplitGroup, id: string) {
  return group.members.find((member) => member.id === id)?.displayName ?? 'Someone'
}

export function SplitGroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<SplitSession | null | undefined>(undefined)
  const [group, setGroup] = useState<SplitGroup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'expense' | 'settle' | 'invite' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [pendingLeave, setPendingLeave] = useState(false)
  const [busy, setBusy] = useState(false)

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [included, setIncluded] = useState<string[]>([])
  const [customShares, setCustomShares] = useState<Record<string, string>>({})
  const [fromMember, setFromMember] = useState('')
  const [toMember, setToMember] = useState('')
  const [settleAmount, setSettleAmount] = useState('')

  const [liveNote, setLiveNote] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const stored = await getSplitSession(id)
    setSession(stored ?? null)
    if (!stored) return
    const result = await fetchGroup(id, stored.sessionToken)
    setGroup(result.group)
    await saveSplitSession({ ...stored, groupName: result.group.name })
  }, [id])

  useEffect(() => {
    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Could not load this group')
    })
  }, [load])

  useSplitRealtime(session?.sessionToken, (message) => {
    if (message.event === 'connected') return
    if (message.group) {
      setGroup(message.group)
      if (session) {
        void saveSplitSession({ ...session, groupName: message.group.name })
      }
    }
    if (message.event === 'member_left' && message.displayName && message.memberId !== session?.memberId) {
      setLiveNote(`${message.displayName} left the group`)
      window.setTimeout(() => setLiveNote(null), 4000)
    }
    if (message.event === 'member_joined' && message.displayName && message.memberId !== session?.memberId) {
      setLiveNote(`${message.displayName} joined the group`)
      window.setTimeout(() => setLiveNote(null), 4000)
    }
    if (message.event === 'expense_added') {
      setLiveNote('A new shared expense arrived')
      window.setTimeout(() => setLiveNote(null), 4000)
    }
    if (message.event === 'settlement_added') {
      setLiveNote('A settle-up was recorded')
      window.setTimeout(() => setLiveNote(null), 4000)
    }
  })

  const names = useMemo(() => {
    if (!group) return new Map<string, string>()
    return new Map(group.members.map((member) => [member.id, member.displayName]))
  }, [group])

  function openExpense() {
    if (!group || !session) return
    setError(null)
    setAmount('')
    setNote('')
    setPaidBy(session.memberId)
    setSplitType('equal')
    setIncluded(group.members.filter((member) => !member.leftAt).map((member) => member.id))
    setCustomShares(
      Object.fromEntries(group.members.filter((member) => !member.leftAt).map((member) => [member.id, ''])),
    )
    setSheet('expense')
  }

  function openSettle() {
    if (!group || !session) return
    setError(null)
    const owed = group.simplified.find((row) => row.fromMemberId === session.memberId)
    setFromMember(owed?.fromMemberId ?? session.memberId)
    setToMember(owed?.toMemberId ?? group.members.find((member) => member.id !== session.memberId)?.id ?? '')
    setSettleAmount(owed ? String(centsToAmount(owed.amountCents)) : '')
    setSheet('settle')
  }

  async function saveExpense() {
    if (!id || !session || !group) return
    const amountCents = rupeesToCents(amount)
    if (amountCents === null) {
      setError('Enter an amount greater than 0')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const body =
        splitType === 'equal'
          ? {
              amountCents,
              splitType,
              paidByMemberId: paidBy,
              memberIds: included,
              note: note.trim(),
              date: todayISO(),
            }
          : {
              amountCents,
              splitType,
              paidByMemberId: paidBy,
              note: note.trim(),
              date: todayISO(),
              shares: group.members
                .map((member) => ({
                  memberId: member.id,
                  shareCents: rupeesToCents(customShares[member.id] ?? '0') ?? 0,
                }))
                .filter((share) => share.shareCents > 0),
            }
      const result = await addExpense(id, session.sessionToken, body)
      setGroup(result.group)
      setSheet(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add expense')
    } finally {
      setBusy(false)
    }
  }

  async function saveSettle() {
    if (!id || !session) return
    const amountCents = rupeesToCents(settleAmount)
    if (amountCents === null) {
      setError('Enter an amount greater than 0')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await addSettlement(id, session.sessionToken, {
        fromMemberId: fromMember,
        toMemberId: toMember,
        amountCents,
      })
      setGroup(result.group)
      setSheet(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not record settlement')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeleteExpense() {
    if (!id || !session || !pendingDelete) return
    setBusy(true)
    try {
      const result = await deleteExpense(id, session.sessionToken, pendingDelete)
      setGroup(result.group)
      setPendingDelete(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  async function confirmLeave() {
    if (!id || !session) return
    setBusy(true)
    setError(null)
    try {
      await leaveGroup(id, session.sessionToken)
      await removeSplitSession(id)
      navigate('/splits')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not leave')
    } finally {
      setBusy(false)
      setPendingLeave(false)
    }
  }

  if (session === undefined) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Opening group..."
        subtitle="Loading split details"
      />
    )
  }

  if (!session) {
    return (
      <section className="space-y-4">
        <header className="flex items-start gap-2">
          <BackButton to="/splits" label="Back to splits" />
          <h1 className="text-2xl font-semibold text-slate-900">Group not on this device</h1>
        </header>
        <p className="text-sm text-slate-500">Join again with the invite code.</p>
      </section>
    )
  }

  if (!group) {
    return (
      <section className="space-y-4">
        <header className="flex items-start gap-2">
          <BackButton to="/splits" label="Back to splits" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{session.groupName}</h1>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
        </header>
        {!error ? (
          <Loader size="sm" className="min-h-[30dvh] gap-4 p-4" title="Loading group..." />
        ) : null}
      </section>
    )
  }

  const currency = group.currency
  const you = session.memberId
  const canDelete = (paidById: string) =>
    paidById === you || group.members.find((member) => member.id === you)?.role === 'owner'

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-2">
        <BackButton to="/splits" label="Back to splits" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{group.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Invite code <span className="font-medium tracking-widest text-slate-800">{group.inviteCode}</span>
          </p>
          {liveNote ? (
            <p className="mt-2 text-sm font-medium text-blue-600" role="status">
              {liveNote}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={() => setSheet('invite')}>
          Invite QR
        </Button>
        <Button className="bg-red-50 text-red-700" onClick={() => setPendingLeave(true)}>
          Leave group
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Leave tells everyone in realtime. Your old splits stay on the balance sheet.
      </p>

      <section className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Balance sheet</h2>
        <ul className="mt-3 divide-y divide-blue-50">
          {group.balances.map((row) => {
            const person = memberName(group, row.memberId)
            const left = group.members.find((member) => member.id === row.memberId)?.leftAt
            const amount = formatCurrency(centsToAmount(Math.abs(row.netCents)), currency)
            let status = 'Settled'
            if (row.netCents > 0) status = `Gets ${amount}`
            if (row.netCents < 0) status = `Owes ${amount}`
            return (
              <li key={row.memberId} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-800">
                  {person}
                  {row.memberId === you ? ' (you)' : ''}
                  {left ? ' · left' : ''}
                </span>
                <span className={row.netCents < 0 ? 'text-red-600' : row.netCents > 0 ? 'text-blue-700' : 'text-slate-400'}>
                  {status}
                </span>
              </li>
            )
          })}
        </ul>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">To settle</h3>
        {group.simplified.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Everyone is settled.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {group.simplified.map((row) => (
              <li key={`${row.fromMemberId}-${row.toMemberId}`} className="text-sm text-slate-700">
                <span className="font-medium">{memberName(group, row.fromMemberId)}</span>
                {' pays '}
                <span className="font-medium">{memberName(group, row.toMemberId)}</span>
                {' '}
                {formatCurrency(centsToAmount(row.amountCents), currency)}
              </li>
            ))}
          </ul>
        )}
        <Button className="mt-4 w-full bg-slate-100 text-slate-700" onClick={openSettle}>
          Record a settle-up
        </Button>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">People</h2>
        </div>
        <ul className="mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white">
          {group.members.map((member, index) => (
            <li
              key={member.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${index === 0 ? '' : 'border-t border-blue-50'}`}
            >
              <span className="text-slate-800">
                {member.displayName}
                {member.id === you ? ' (you)' : ''}
                {member.leftAt ? ' · left' : ''}
              </span>
              <span className="text-xs text-slate-400">{member.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Expenses</h2>
          <button
            type="button"
            onClick={openExpense}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600"
          >
            <Plus className="size-4" aria-hidden />
            Add
          </button>
        </div>
        {group.expenses.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={Plus}
              compact
              title="No shared expenses yet"
              description="Add a bill and split it equally or with custom amounts."
              actionLabel="Add expense"
              onAction={openExpense}
            />
          </div>
        ) : (
          <ul className="mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white">
            {[...group.expenses].reverse().map((expense, index) => (
              <li
                key={expense.id}
                className={`px-4 py-3 ${index === 0 ? '' : 'border-t border-blue-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {expense.note || 'Shared expense'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {names.get(expense.paidByMemberId)} paid · {expense.date} · {expense.splitType}
                    </p>
                    <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                      {expense.shares.map((share) => (
                        <li key={share.memberId}>
                          {names.get(share.memberId)} · {formatCurrency(centsToAmount(share.shareCents), currency)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatCurrency(centsToAmount(expense.amountCents), currency)}
                  </p>
                </div>
                {canDelete(expense.paidByMemberId) ? (
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-red-600"
                    onClick={() => setPendingDelete(expense.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {group.settlements.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Settle-ups</h2>
          <ul className="mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white">
            {[...group.settlements].reverse().map((row, index) => (
              <li
                key={row.id}
                className={`px-4 py-3 text-sm text-slate-700 ${index === 0 ? '' : 'border-t border-blue-50'}`}
              >
                {memberName(group, row.fromMemberId)} paid {memberName(group, row.toMemberId)}{' '}
                {formatCurrency(centsToAmount(row.amountCents), currency)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SplitSheet
        open={sheet === 'expense'}
        title="Add expense"
        onClose={() => {
          if (!busy) setSheet(null)
        }}
      >
        <label className="block">
          <span className="text-sm text-slate-600">Amount</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            placeholder="0"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-slate-600">Note</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            placeholder="Dinner, taxi, groceries"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-slate-600">Paid by</span>
          <select
            value={paidBy}
            onChange={(event) => setPaidBy(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
          >
            {group.members.filter((member) => !member.leftAt).map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
          {(['equal', 'custom'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`rounded-xl py-2 text-sm font-medium capitalize ${
                splitType === type ? 'bg-blue-600 text-white' : 'text-slate-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {splitType === 'equal' ? (
          <ul className="mt-3 space-y-2">
            {group.members.filter((member) => !member.leftAt).map((member) => (
              <label key={member.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={included.includes(member.id)}
                  onChange={() => {
                    setIncluded((current) =>
                      current.includes(member.id)
                        ? current.filter((id) => id !== member.id)
                        : [...current, member.id],
                    )
                  }}
                />
                {member.displayName}
              </label>
            ))}
          </ul>
        ) : (
          <ul className="mt-3 space-y-2">
            {group.members.filter((member) => !member.leftAt).map((member) => (
              <label key={member.id} className="block text-sm text-slate-600">
                {member.displayName}
                <input
                  inputMode="decimal"
                  value={customShares[member.id] ?? ''}
                  onChange={(event) => {
                    setCustomShares((current) => ({ ...current, [member.id]: event.target.value }))
                  }}
                  className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2 text-sm outline-none"
                  placeholder="0"
                />
              </label>
            ))}
          </ul>
        )}
        {error && sheet === 'expense' ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={busy} onClick={() => void saveExpense()}>
          {busy ? 'Saving...' : 'Save expense'}
        </Button>
      </SplitSheet>

      <SplitSheet
        open={sheet === 'settle'}
        title="Settle up"
        onClose={() => {
          if (!busy) setSheet(null)
        }}
      >
        <label className="block">
          <span className="text-sm text-slate-600">From</span>
          <select
            value={fromMember}
            onChange={(event) => setFromMember(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
          >
            {group.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-slate-600">To</span>
          <select
            value={toMember}
            onChange={(event) => setToMember(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
          >
            {group.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-slate-600">Amount</span>
          <input
            inputMode="decimal"
            value={settleAmount}
            onChange={(event) => setSettleAmount(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
          />
        </label>
        {error && sheet === 'settle' ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={busy} onClick={() => void saveSettle()}>
          {busy ? 'Saving...' : 'Record payment'}
        </Button>
      </SplitSheet>

      <SplitSheet
        open={sheet === 'invite'}
        title="Invite friends"
        onClose={() => setSheet(null)}
      >
        <InviteQr code={group.inviteCode} />
      </SplitSheet>

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this expense?"
          description="Balances will be recalculated for everyone in the group."
          confirmLabel="Delete"
          busyLabel="Deleting…"
          busy={busy}
          danger
          onCancel={() => {
            if (!busy) setPendingDelete(null)
          }}
          onConfirm={() => void confirmDeleteExpense()}
        />
      ) : null}

      {pendingLeave ? (
        <ConfirmDialog
          title="Leave this group?"
          description="Everyone still in the group will see that you left. Your past splits stay on the balance sheet."
          confirmLabel="Leave"
          busyLabel="Leaving…"
          busy={busy}
          danger
          error={error}
          onCancel={() => {
            if (!busy) setPendingLeave(false)
          }}
          onConfirm={() => void confirmLeave()}
        />
      ) : null}
    </section>
  )
}
