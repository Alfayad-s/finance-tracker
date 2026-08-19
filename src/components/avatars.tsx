import { useId, type ReactNode } from 'react'

type Mouth = 'smile' | 'grin'
type Ink = 'dark' | 'light'

interface AvatarSpec {
  bg: string
  shape: string
  mouth: Mouth
  ink: Ink
  faceTransform: string
  shapeTransform: string
  radius: number
  rgb: string
  label: string
}

const AVATARS: AvatarSpec[] = [
  { bg: '#ff005b', shape: '#ffb238', mouth: 'smile', ink: 'dark', faceTransform: 'translate(4.5 -4) rotate(9 18 18)', shapeTransform: 'translate(9 -5) rotate(219 18 18)', radius: 6, rgb: '255, 0, 91', label: 'Coral' },
  { bg: '#ff7d10', shape: '#0a0310', mouth: 'smile', ink: 'light', faceTransform: 'translate(7 -6) rotate(-5 18 18)', shapeTransform: 'translate(5 -1) rotate(55 18 18) scale(1.1)', radius: 6, rgb: '255, 125, 16', label: 'Sunset' },
  { bg: '#0a0310', shape: '#ff005b', mouth: 'grin', ink: 'light', faceTransform: 'translate(-3 3.5) rotate(7 18 18)', shapeTransform: 'translate(-3 7) rotate(227 18 18) scale(1.2)', radius: 36, rgb: '255, 0, 91', label: 'Night' },
  { bg: '#d8fcb3', shape: '#89fcb3', mouth: 'smile', ink: 'dark', faceTransform: 'translate(4.5 -4) rotate(9 18 18)', shapeTransform: 'translate(9 -5) rotate(219 18 18)', radius: 6, rgb: '137, 252, 179', label: 'Mint' },
  { bg: '#1d4ed8', shape: '#93c5fd', mouth: 'smile', ink: 'light', faceTransform: 'translate(3 -2) rotate(-8 18 18)', shapeTransform: 'translate(-4 4) rotate(200 18 18) scale(1.05)', radius: 8, rgb: '37, 99, 235', label: 'Ocean' },
  { bg: '#e0f2fe', shape: '#38bdf8', mouth: 'grin', ink: 'dark', faceTransform: 'translate(2 0) rotate(4 18 18)', shapeTransform: 'translate(8 -8) rotate(40 18 18)', radius: 10, rgb: '14, 165, 233', label: 'Sky' },
  { bg: '#6366f1', shape: '#c4b5fd', mouth: 'smile', ink: 'light', faceTransform: 'translate(-2 -3) rotate(12 18 18)', shapeTransform: 'translate(6 2) rotate(240 18 18) scale(1.15)', radius: 18, rgb: '99, 102, 241', label: 'Iris' },
  { bg: '#0f766e', shape: '#99f6e4', mouth: 'grin', ink: 'dark', faceTransform: 'translate(5 -5) rotate(-10 18 18)', shapeTransform: 'translate(-6 6) rotate(160 18 18)', radius: 12, rgb: '13, 148, 136', label: 'Tide' },
  { bg: '#f59e0b', shape: '#78350f', mouth: 'smile', ink: 'light', faceTransform: 'translate(1 -1) rotate(6 18 18)', shapeTransform: 'translate(4 -6) rotate(70 18 18) scale(1.08)', radius: 6, rgb: '245, 158, 11', label: 'Honey' },
  { bg: '#6b21a8', shape: '#e879f9', mouth: 'grin', ink: 'light', faceTransform: 'translate(-4 2) rotate(-6 18 18)', shapeTransform: 'translate(2 8) rotate(210 18 18) scale(1.2)', radius: 36, rgb: '168, 85, 247', label: 'Plum' },
  { bg: '#cbd5e1', shape: '#334155', mouth: 'smile', ink: 'light', faceTransform: 'translate(6 -4) rotate(8 18 18)', shapeTransform: 'translate(-2 -3) rotate(30 18 18)', radius: 8, rgb: '100, 116, 139', label: 'Steel' },
  { bg: '#fed7aa', shape: '#fb7185', mouth: 'smile', ink: 'dark', faceTransform: 'translate(0 -3) rotate(-4 18 18)', shapeTransform: 'translate(10 -2) rotate(225 18 18)', radius: 14, rgb: '251, 146, 60', label: 'Peach' },
  { bg: '#fda4af', shape: '#be123c', mouth: 'grin', ink: 'dark', faceTransform: 'translate(-1 -2) rotate(5 18 18)', shapeTransform: 'translate(7 3) rotate(190 18 18)', radius: 16, rgb: '244, 63, 94', label: 'Rose' },
  { bg: '#ecfccb', shape: '#65a30d', mouth: 'smile', ink: 'dark', faceTransform: 'translate(3 -5) rotate(-7 18 18)', shapeTransform: 'translate(-5 5) rotate(50 18 18) scale(1.1)', radius: 8, rgb: '101, 163, 13', label: 'Lime' },
  { bg: '#1e3a8a', shape: '#93c5fd', mouth: 'grin', ink: 'light', faceTransform: 'translate(2 1) rotate(10 18 18)', shapeTransform: 'translate(-8 -2) rotate(220 18 18)', radius: 20, rgb: '30, 64, 175', label: 'Navy' },
  { bg: '#ff6b6b', shape: '#ffe66d', mouth: 'smile', ink: 'dark', faceTransform: 'translate(-5 -1) rotate(-12 18 18)', shapeTransform: 'translate(4 -8) rotate(35 18 18)', radius: 10, rgb: '239, 68, 68', label: 'Poppy' },
  { bg: '#14532d', shape: '#86efac', mouth: 'grin', ink: 'light', faceTransform: 'translate(4 -3) rotate(3 18 18)', shapeTransform: 'translate(8 6) rotate(250 18 18) scale(1.12)', radius: 24, rgb: '22, 163, 74', label: 'Forest' },
  { bg: '#db2777', shape: '#fbcfe8', mouth: 'smile', ink: 'light', faceTransform: 'translate(0 -4) rotate(8 18 18)', shapeTransform: 'translate(-3 -6) rotate(80 18 18)', radius: 6, rgb: '219, 39, 119', label: 'Magenta' },
  { bg: '#fef3c7', shape: '#d97706', mouth: 'grin', ink: 'dark', faceTransform: 'translate(6 0) rotate(-3 18 18)', shapeTransform: 'translate(2 8) rotate(200 18 18)', radius: 12, rgb: '217, 119, 6', label: 'Sand' },
  { bg: '#1e293b', shape: '#94a3b8', mouth: 'smile', ink: 'light', faceTransform: 'translate(-2 2) rotate(14 18 18)', shapeTransform: 'translate(6 -4) rotate(140 18 18) scale(1.05)', radius: 18, rgb: '51, 65, 85', label: 'Ink' },
  { bg: '#ccfbf1', shape: '#0d9488', mouth: 'grin', ink: 'dark', faceTransform: 'translate(1 -6) rotate(-9 18 18)', shapeTransform: 'translate(-7 2) rotate(45 18 18)', radius: 9, rgb: '13, 148, 136', label: 'Aqua' },
  { bg: '#881337', shape: '#fb7185', mouth: 'smile', ink: 'light', faceTransform: 'translate(5 1) rotate(6 18 18)', shapeTransform: 'translate(3 7) rotate(230 18 18) scale(1.18)', radius: 32, rgb: '190, 18, 60', label: 'Berry' },
  { bg: '#fef08a', shape: '#ca8a04', mouth: 'grin', ink: 'dark', faceTransform: 'translate(-4 -2) rotate(-5 18 18)', shapeTransform: 'translate(9 -3) rotate(25 18 18)', radius: 7, rgb: '202, 138, 4', label: 'Lemon' },
  { bg: '#4c1d95', shape: '#c4b5fd', mouth: 'smile', ink: 'light', faceTransform: 'translate(2 -1) rotate(11 18 18)', shapeTransform: 'translate(-4 8) rotate(175 18 18)', radius: 22, rgb: '109, 40, 217', label: 'Violet' },
  { bg: '#9a3412', shape: '#fdba74', mouth: 'grin', ink: 'light', faceTransform: 'translate(-3 -4) rotate(2 18 18)', shapeTransform: 'translate(5 -7) rotate(60 18 18) scale(1.08)', radius: 14, rgb: '194, 65, 12', label: 'Brick' },
  { bg: '#f0f9ff', shape: '#0284c7', mouth: 'smile', ink: 'dark', faceTransform: 'translate(4 2) rotate(-11 18 18)', shapeTransform: 'translate(-6 -5) rotate(95 18 18)', radius: 11, rgb: '2, 132, 199', label: 'Ice' },
  { bg: '#365314', shape: '#bef264', mouth: 'grin', ink: 'light', faceTransform: 'translate(0 3) rotate(7 18 18)', shapeTransform: 'translate(8 1) rotate(215 18 18)', radius: 28, rgb: '77, 124, 15', label: 'Olive' },
  { bg: '#fce7f3', shape: '#ec4899', mouth: 'smile', ink: 'dark', faceTransform: 'translate(-6 -3) rotate(4 18 18)', shapeTransform: 'translate(1 -9) rotate(40 18 18) scale(1.14)', radius: 8, rgb: '236, 72, 153', label: 'Candy' },
  { bg: '#111827', shape: '#60a5fa', mouth: 'grin', ink: 'light', faceTransform: 'translate(3 -2) rotate(-8 18 18)', shapeTransform: 'translate(-2 6) rotate(188 18 18)', radius: 36, rgb: '37, 99, 235', label: 'Charcoal' },
  { bg: '#ffedd5', shape: '#ea580c', mouth: 'smile', ink: 'dark', faceTransform: 'translate(1 1) rotate(13 18 18)', shapeTransform: 'translate(7 4) rotate(255 18 18)', radius: 15, rgb: '234, 88, 12', label: 'Apricot' },
  { bg: '#022c22', shape: '#5eead4', mouth: 'grin', ink: 'light', faceTransform: 'translate(-1 -5) rotate(-4 18 18)', shapeTransform: 'translate(-8 3) rotate(70 18 18) scale(1.1)', radius: 19, rgb: '13, 148, 136', label: 'Moss' },
  { bg: '#f5d0fe', shape: '#a21caf', mouth: 'smile', ink: 'dark', faceTransform: 'translate(5 -1) rotate(9 18 18)', shapeTransform: 'translate(4 -4) rotate(130 18 18)', radius: 13, rgb: '162, 28, 175', label: 'Orchid' },
]

export const AVATAR_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
] as const
export type AvatarId = (typeof AVATAR_IDS)[number]

export const AVATAR_RGB = Object.fromEntries(
  AVATARS.map((avatar, index) => [index + 1, avatar.rgb]),
) as Record<AvatarId, string>

export const AVATAR_LABELS = Object.fromEntries(
  AVATARS.map((avatar, index) => [index + 1, avatar.label]),
) as Record<AvatarId, string>

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'number' && value >= 1 && value <= AVATARS.length
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
  const spec = AVATARS[id - 1]
  return blob(
    spec.bg,
    spec.shape,
    spec.mouth,
    spec.ink,
    spec.faceTransform,
    spec.shapeTransform,
    spec.radius,
  )
}

function blob(
  bg: string,
  shape: string,
  mouth: Mouth,
  ink: Ink,
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
