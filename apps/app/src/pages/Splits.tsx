import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { useSettings } from '@/db/hooks'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader } from '@/components/ui/Loader'
import { SplitSheet } from '@/components/split/SplitSheet'
import { createGroup, joinGroup } from '@/split/api'
import { saveSplitSession, useSplitSessions } from '@/split/sessions'

export function SplitsPage() {
  const sessions = useSplitSessions()
  const settings = useSettings()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<'create' | 'join' | null>(null)
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profileName = settings?.displayName.trim() ?? ''

  function openSheet(next: 'create' | 'join') {
    setError(null)
    setName('')
    setInviteCode('')
    if (!profileName) {
      setError('Set your name in Profile first. That name is used in split groups.')
      setSheet(next)
      return
    }
    setSheet(next)
  }

  async function handleCreate() {
    const groupName = name.trim()
    if (!groupName) {
      setError('Group name is required')
      return
    }
    if (!profileName) {
      setError('Set your name in Profile first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await createGroup({
        name: groupName,
        displayName: profileName,
        currency: settings?.currency,
      })
      await saveSplitSession({
        groupId: result.group.id,
        sessionToken: result.sessionToken,
        memberId: result.memberId,
        displayName: profileName,
        groupName: result.group.name,
      })
      setSheet(null)
      navigate(`/splits/${result.group.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create group')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      setError('Invite code is required')
      return
    }
    if (!profileName) {
      setError('Set your name in Profile first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await joinGroup({
        inviteCode: inviteCode.trim(),
        displayName: profileName,
      })
      await saveSplitSession({
        groupId: result.group.id,
        sessionToken: result.sessionToken,
        memberId: result.memberId,
        displayName: profileName,
        groupName: result.group.name,
      })
      setSheet(null)
      navigate(`/splits/${result.group.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not join group')
    } finally {
      setBusy(false)
    }
  }

  if (!sessions || !settings) {
    return (
      <Loader
        size="sm"
        className="min-h-[50dvh] gap-4 p-4"
        title="Loading splits..."
        subtitle="Reading groups saved on this device"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-2">
        <BackButton to="/" label="Back to home" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Splits</h1>
          <p className="mt-1 text-sm text-slate-500">
            Shared bills with friends. Only this feature uses the cloud. Your personal money stays
            here.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => openSheet('create')}>New group</Button>
        <Button className="bg-slate-100 text-slate-700" onClick={() => openSheet('join')}>
          Join
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups on this device"
          description="Create a group and share the invite code, or join with a code from a friend."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
          {sessions.map((session, index) => (
            <li key={session.groupId} className={index === 0 ? '' : 'border-t border-blue-50'}>
              <Link
                to={`/splits/${session.groupId}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <span>
                  <span className="block text-sm font-medium text-slate-900">{session.groupName}</span>
                  <span className="block text-xs text-slate-400">You as {session.displayName}</span>
                </span>
                <ChevronRight className="size-4 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SplitSheet
        open={sheet === 'create'}
        title="New group"
        onClose={() => {
          if (!busy) setSheet(null)
        }}
      >
        <label className="block">
          <span className="text-sm text-slate-600">Group name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            placeholder="Trip, flat, dinner"
          />
        </label>
        <p className="mt-3 text-sm text-slate-500">
          You will join as{' '}
          <span className="font-medium text-slate-800">{profileName || 'your profile name'}</span>
          .{' '}
          <Link to="/settings/profile" className="font-medium text-blue-600">
            Change in Profile
          </Link>
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={busy || !profileName} onClick={() => void handleCreate()}>
          {busy ? 'Creating...' : 'Create group'}
        </Button>
      </SplitSheet>

      <SplitSheet
        open={sheet === 'join'}
        title="Join a group"
        onClose={() => {
          if (!busy) setSheet(null)
        }}
      >
        <label className="block">
          <span className="text-sm text-slate-600">Invite code</span>
          <input
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            className="mt-1 w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-sm tracking-widest outline-none"
            placeholder="ABCD2345"
            autoCapitalize="characters"
          />
        </label>
        <p className="mt-3 text-sm text-slate-500">
          You will join as{' '}
          <span className="font-medium text-slate-800">{profileName || 'your profile name'}</span>
          .{' '}
          <Link to="/settings/profile" className="font-medium text-blue-600">
            Change in Profile
          </Link>
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={busy || !profileName} onClick={() => void handleJoin()}>
          {busy ? 'Joining...' : 'Join group'}
        </Button>
      </SplitSheet>
    </section>
  )
}
