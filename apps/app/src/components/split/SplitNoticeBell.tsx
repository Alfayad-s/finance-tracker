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
    <>
      <button
        type="button"
        aria-label={unread ? `${unread} unread split notifications` : 'Split notifications'}
        onClick={() => {
          if (getSoundPref() !== 'off') enableSoundFromUserGesture()
          setOpen((current) => !current)
        }}
        className="fixed top-5 right-4 z-40 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_24px_rgb(0,0,0,0.08)]"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-x-0 top-16 z-40 mx-auto w-full max-w-lg px-4">
          <div className="max-h-[55dvh] overflow-y-auto rounded-2xl border border-blue-100 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
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
    </>
  )
}
