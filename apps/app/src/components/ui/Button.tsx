import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Button({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100',
        className,
      )}
      {...props}
    />
  )
}
