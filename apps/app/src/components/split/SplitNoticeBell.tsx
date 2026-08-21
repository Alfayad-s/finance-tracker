import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { markAllNoticesRead, markNoticeRead, useSplitNotices } from '@/split/notices'
import { enableSoundFromUserGesture, getSoundPref } from '@/split/sound'

export function SplitNoticeBell() {
  const notices = useSplitNotices() ?? []
  const unread = notices.filter((notice) => !notice.read).length
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `${unread} unread split notifications` : 'Split notifications'}
        onClick={() => {
          setOpen((current) => !current)
        }}
        className="relative rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
      >
        <Bell className="size-5" strokeWidth={1.75} aria-hidden />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-blue-600" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-30 mt-1 w-[min(calc(100vw-2.5rem),20rem)] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl">
          <div className="max-h-[55dvh] overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <div className="flex items-center gap-3">
                {getSoundPref() === 'off' ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-blue-600"
                    onClick={() => enableSoundFromUserGesture()}
                  >
                    Enable sound
                  </button>
                ) : null}
                {unread > 0 ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-blue-600"
                    onClick={() => void markAllNoticesRead()}
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
            </div>
            {notices.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No split alerts yet.</p>
            ) : (
              <ul className="space-y-1">
                {notices.map((notice) => (
                  <li key={notice.id}>
                    <Link
                      to={`/splits/${notice.groupId}`}
                      onClick={() => {
                        void markNoticeRead(notice.id)
                        setOpen(false)
                      }}
                      className={`block rounded-xl px-3 py-2 ${notice.read ? 'bg-white' : 'bg-blue-50'}`}
                    >
                      <p className="text-sm font-medium text-slate-900">{notice.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{notice.body}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
