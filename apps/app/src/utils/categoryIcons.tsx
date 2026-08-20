import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Car,
  CircleEllipsis,
  CirclePlus,
  Clapperboard,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  TreePalm,
  User,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

export const CATEGORY_ICON_NAMES = [
  'PiggyBank',
  'Plane',
  'House',
  'GraduationCap',
  'Heart',
  'TreePalm',
  'Wallet',
  'Gift',
  'Car',
  'Briefcase',
  'UtensilsCrossed',
  'ShoppingBag',
  'Receipt',
  'HeartPulse',
  'Clapperboard',
  'User',
  'CircleEllipsis',
  'CirclePlus',
] as const

const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  Car,
  CircleEllipsis,
  CirclePlus,
  Clapperboard,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Palmtree: TreePalm,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  TreePalm,
  User,
  UtensilsCrossed,
  Wallet,
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICONS[name] ?? CircleEllipsis
  return <Icon className={className} strokeWidth={1.75} aria-hidden />
}
