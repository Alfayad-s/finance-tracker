import { useId, type ReactNode } from 'react'

export const AVATAR_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type AvatarId = (typeof AVATAR_IDS)[number]

export const AVATAR_RGB: Record<AvatarId, string> = {
  1: '255, 0, 91',
  2: '255, 125, 16',
  3: '255, 0, 91',
  4: '137, 252, 179',
  5: '37, 99, 235',
  6: '14, 165, 233',
  7: '99, 102, 241',
  8: '13, 148, 136',
  9: '245, 158, 11',
  10: '168, 85, 247',
  11: '100, 116, 139',
  12: '251, 146, 60',
}

export const AVATAR_LABELS: Record<AvatarId, string> = {
  1: 'Coral',
  2: 'Sunset',
  3: 'Night',
  4: 'Mint',
  5: 'Ocean',
  6: 'Sky',
  7: 'Iris',
  8: 'Tide',
  9: 'Honey',
  10: 'Plum',
  11: 'Steel',
  12: 'Peach',
}

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'number' && (AVATAR_IDS as readonly number[]).includes(value)
}

export function AvatarFace({
  id,
  label,
}: {
  id: AvatarId
  label?: string
}) {
  const maskId = useId()
  const title = label ?? AVATAR_LABELS[id]

  return (
    <svg
      aria-label={title}
      fill="none"
      height="40"
      role="img"
      viewBox="0 0 36 36"
      width="40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect fill="#FFFFFF" height="36" rx="72" width="36" />
      </mask>
      <g mask={`url(#${maskId})`}>{face(id)}</g>
    </svg>
  )
}

function face(id: AvatarId): ReactNode {
  switch (id) {
    case 1:
      return blob('#ff005b', '#ffb238', 'smile', 'dark', 'translate(4.5 -4) rotate(9 18 18)', 'translate(9 -5) rotate(219 18 18)', 6)
    case 2:
      return blob('#ff7d10', '#0a0310', 'smile', 'light', 'translate(7 -6) rotate(-5 18 18)', 'translate(5 -1) rotate(55 18 18) scale(1.1)', 6)
    case 3:
      return blob('#0a0310', '#ff005b', 'grin', 'light', 'translate(-3 3.5) rotate(7 18 18)', 'translate(-3 7) rotate(227 18 18) scale(1.2)', 36)
    case 4:
      return blob('#d8fcb3', '#89fcb3', 'smile', 'dark', 'translate(4.5 -4) rotate(9 18 18)', 'translate(9 -5) rotate(219 18 18)', 6)
    case 5:
      return blob('#1d4ed8', '#93c5fd', 'smile', 'light', 'translate(3 -2) rotate(-8 18 18)', 'translate(-4 4) rotate(200 18 18) scale(1.05)', 8)
    case 6:
      return blob('#e0f2fe', '#38bdf8', 'grin', 'dark', 'translate(2 0) rotate(4 18 18)', 'translate(8 -8) rotate(40 18 18)', 10)
    case 7:
      return blob('#6366f1', '#c4b5fd', 'smile', 'light', 'translate(-2 -3) rotate(12 18 18)', 'translate(6 2) rotate(240 18 18) scale(1.15)', 18)
    case 8:
      return blob('#0f766e', '#99f6e4', 'grin', 'dark', 'translate(5 -5) rotate(-10 18 18)', 'translate(-6 6) rotate(160 18 18)', 12)
    case 9:
      return blob('#f59e0b', '#78350f', 'smile', 'light', 'translate(1 -1) rotate(6 18 18)', 'translate(4 -6) rotate(70 18 18) scale(1.08)', 6)
    case 10:
      return blob('#6b21a8', '#e879f9', 'grin', 'light', 'translate(-4 2) rotate(-6 18 18)', 'translate(2 8) rotate(210 18 18) scale(1.2)', 36)
    case 11:
      return blob('#cbd5e1', '#334155', 'smile', 'light', 'translate(6 -4) rotate(8 18 18)', 'translate(-2 -3) rotate(30 18 18)', 8)
    case 12:
      return blob('#fed7aa', '#fb7185', 'smile', 'dark', 'translate(0 -3) rotate(-4 18 18)', 'translate(10 -2) rotate(225 18 18)', 14)
  }
}

function blob(
  bg: string,
  shape: string,
  mouth: 'smile' | 'grin',
  ink: 'dark' | 'light',
  faceTransform: string,
  shapeTransform: string,
  radius: number,
) {
  const color = ink === 'dark' ? '#000000' : '#FFFFFF'
  return (
    <>
      <rect fill={bg} height="36" width="36" />
      <rect fill={shape} height="36" rx={radius} transform={shapeTransform} width="36" />
      <g transform={faceTransform}>
        {mouth === 'grin' ? (
          <path d="M13,21 a1,0.75 0 0,0 10,0" fill={color} />
        ) : (
          <path d="M15 19c2 1 4 1 6 0" fill="none" stroke={color} strokeLinecap="round" />
        )}
        <rect fill={color} height="2" rx="1" width="1.5" x={ink === 'dark' ? 10 : 12} y="14" />
        <rect fill={color} height="2" rx="1" width="1.5" x={ink === 'dark' ? 24 : 22} y="14" />
      </g>
    </>
  )
}
