import type { Account, BankIssuerId, CardNetwork } from '@/types'
import { cn } from '@/lib/utils'

export const BANK_ISSUERS: {
  id: BankIssuerId
  label: string
  mark: string
  accent: string
}[] = [
  { id: 'generic', label: 'Custom', mark: 'BK', accent: '#334155' },
  { id: 'hdfc', label: 'HDFC Bank', mark: 'HDFC', accent: '#004c8f' },
  { id: 'icici', label: 'ICICI Bank', mark: 'ICICI', accent: '#f37021' },
  { id: 'sbi', label: 'State Bank', mark: 'SBI', accent: '#22409a' },
  { id: 'axis', label: 'Axis Bank', mark: 'AXIS', accent: '#97144d' },
  { id: 'kotak', label: 'Kotak', mark: 'KOTAK', accent: '#ed1c24' },
  { id: 'hsbc', label: 'HSBC', mark: 'HSBC', accent: '#db0011' },
  { id: 'chase', label: 'Chase', mark: 'CHASE', accent: '#117aca' },
  { id: 'citi', label: 'Citi', mark: 'citi', accent: '#003b70' },
  { id: 'amex', label: 'American Express', mark: 'AMEX', accent: '#006fcf' },
]

export const CARD_NETWORKS: { id: CardNetwork; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'rupay', label: 'RuPay' },
  { id: 'amex', label: 'Amex' },
]

export function issuerOf(id?: BankIssuerId) {
  return BANK_ISSUERS.find((row) => row.id === id) ?? BANK_ISSUERS[0]
}

export function wordInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return parts
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 4)
    .toUpperCase()
}

export function BankFace({
  account,
  light,
}: {
  account: Pick<Account, 'issuerId' | 'brandFace' | 'logoDataUrl' | 'name'>
  light?: boolean
}) {
  const issuer = issuerOf(account.issuerId)
  const useLogo = (account.brandFace ?? 'logo') === 'logo'
  const label = issuer.id === 'generic' ? account.name : issuer.label

  if (!useLogo) {
    return (
      <span
        className={cn(
          'min-w-0 truncate text-sm font-semibold tracking-wide',
          light ? 'text-white' : 'text-current',
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      {account.logoDataUrl ? (
        <img src={account.logoDataUrl} alt="" className="block size-8 shrink-0 object-contain" />
      ) : (
        <BankLogo id={issuer.id} className="block size-8 shrink-0" />
      )}
      <span
        className={cn(
          'min-w-0 truncate text-sm font-semibold tracking-wide',
          light ? 'text-white' : 'text-current',
        )}
      >
        {label}
      </span>
    </span>
  )
}

function BankLogo({ id, className }: { id: BankIssuerId; className?: string }) {
  const issuer = issuerOf(id)
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {id === 'hdfc' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#004c8f" />
          <path d="M6 22 16 6l10 16H6Z" fill="#ed1c24" />
          <path d="M10 22h12l-6-10-6 10Z" fill="#fff" />
        </>
      ) : id === 'icici' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#f37021" />
          <circle cx="16" cy="16" r="7" fill="#fff" />
          <path d="M16 10v12" stroke="#f37021" strokeWidth="3.2" strokeLinecap="round" />
        </>
      ) : id === 'sbi' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#22409a" />
          <circle cx="16" cy="16" r="8" fill="none" stroke="#fff" strokeWidth="2.4" />
          <circle cx="16" cy="16" r="2.4" fill="#fff" />
        </>
      ) : id === 'axis' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#97144d" />
          <path d="M8 23 16 9l8 14" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
        </>
      ) : id === 'kotak' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#ed1c24" />
          <rect x="8" y="8" width="16" height="16" rx="3" fill="#fff" />
          <path d="M12 20V12h3.4c2 0 3.2 1 3.2 2.6 0 1.6-1.2 2.6-3.2 2.6H12" fill="none" stroke="#ed1c24" strokeWidth="1.8" />
        </>
      ) : id === 'hsbc' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#db0011" />
          <path d="M16 6 26 16 16 26 6 16Z" fill="#fff" />
          <path d="M16 11 21 16 16 21 11 16Z" fill="#db0011" />
        </>
      ) : id === 'chase' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#117aca" />
          <path d="M16 7 25 16 16 25 7 16Z" fill="#fff" />
        </>
      ) : id === 'citi' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#003b70" />
          <path d="M7 18c2.4 4 15.6 4 18 0" fill="none" stroke="#e31c3d" strokeWidth="2.4" strokeLinecap="round" />
          <text x="16" y="16" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui">
            citi
          </text>
        </>
      ) : id === 'amex' ? (
        <>
          <rect width="32" height="32" rx="8" fill="#006fcf" />
          <rect x="5" y="11" width="22" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.6" />
          <text x="16" y="19" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="800" fontFamily="system-ui">
            AMEX
          </text>
        </>
      ) : (
        <>
          <rect width="32" height="32" rx="8" fill={issuer.accent} />
          <text x="16" y="20" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800" fontFamily="system-ui">
            {issuer.mark.slice(0, 2)}
          </text>
        </>
      )}
    </svg>
  )
}

export function NetworkMark({
  network,
  className,
}: {
  network?: CardNetwork
  className?: string
}) {
  if (!network || network === 'none') return null
  if (network === 'mastercard') {
    return (
      <svg viewBox="0 0 40 24" className={cn('h-6 w-10', className)} aria-hidden>
        <circle cx="15" cy="12" r="8.5" fill="#eb001b" />
        <circle cx="25" cy="12" r="8.5" fill="#f79e1b" />
        <path d="M20 6.2a8.5 8.5 0 0 1 0 11.6 8.5 8.5 0 0 1 0-11.6Z" fill="#ff5f00" />
      </svg>
    )
  }
  if (network === 'visa') {
    return (
      <span className={cn('text-[15px] font-black italic tracking-tight text-[#1a1f71]', className)}>
        VISA
      </span>
    )
  }
  if (network === 'amex') {
    return (
      <span className={cn('rounded border-2 border-current px-1.5 py-0.5 text-[9px] font-black tracking-widest', className)}>
        AMEX
      </span>
    )
  }
  return <span className={cn('text-[12px] font-extrabold tracking-wide', className)}>RuPay</span>
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function groupedPan(digits: string) {
  return digits.replace(/(.{4})(?=.)/g, '$1 ').trim()
}

export function panDigits(account: { cardNumber?: string; last4?: string }) {
  const full = digitsOnly(account.cardNumber ?? '')
  if (full.length >= 12) return full
  return digitsOnly(account.last4 ?? '')
}

export function maskedPan(last4?: string) {
  const digits = (last4 ?? '').replace(/\D/g, '').slice(-4)
  if (digits.length !== 4) return '••••  ••••  ••••  ••••'
  return `••••  ••••  ••••  ${digits}`
}

export function displayPan(account: { cardNumber?: string; last4?: string }, revealed: boolean) {
  const full = digitsOnly(account.cardNumber ?? '')
  if (full.length > 0) {
    return revealed ? groupedPan(full) : groupedPan(maskKeepingLast4(full))
  }
  return maskedPan(account.last4)
}

function maskKeepingLast4(digits: string) {
  if (digits.length <= 4) return `${'•'.repeat(12)}${digits}`
  return `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}`
}

export function displayCvv(cvv: string | undefined, revealed: boolean) {
  const digits = digitsOnly(cvv ?? '')
  if (!digits) return '•••'
  return revealed ? digits : '•'.repeat(Math.min(4, Math.max(3, digits.length)))
}
