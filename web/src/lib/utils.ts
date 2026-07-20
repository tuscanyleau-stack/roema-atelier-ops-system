import { StatusColor } from './types'

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

type ColorConfig = { bg: string; text: string; border: string; dot: string }

export const STATUS_COLORS: Record<StatusColor, ColorConfig> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-600' },
  teal:  { bg: 'bg-teal-50',  text: 'text-teal-800',  border: 'border-teal-200',  dot: 'bg-teal-600'  },
  blue:  { bg: 'bg-blue-50',  text: 'text-blue-800',  border: 'border-blue-200',  dot: 'bg-blue-600'  },
  coral: { bg: 'bg-orange-50',text: 'text-orange-800',border: 'border-orange-200',dot: 'bg-orange-600'},
  green: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-600' },
  red:   { bg: 'bg-red-50',   text: 'text-red-800',   border: 'border-red-200',   dot: 'bg-red-600'   },
}

export const AVATAR_COLORS: Record<StatusColor, string> = {
  amber: 'bg-amber-100 text-amber-800',
  teal:  'bg-teal-100 text-teal-800',
  blue:  'bg-blue-100 text-blue-800',
  coral: 'bg-orange-100 text-orange-800',
  green: 'bg-green-100 text-green-800',
  red:   'bg-red-100 text-red-800',
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString()
}

export function getProspectStatusConfig(status: string) {
  const map: Record<string, { label: string; color: StatusColor }> = {
    new:          { label: 'New',          color: 'amber' },
    qualified:    { label: 'Qualified',    color: 'teal'  },
    brief_booked: { label: 'Brief booked', color: 'green' },
  }
  return map[status] ?? { label: status, color: 'blue' as StatusColor }
}
