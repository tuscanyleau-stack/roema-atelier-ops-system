import { StatusColor } from '@/lib/types'
import { STATUS_COLORS, cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  color: StatusColor
  className?: string
}

export default function StatusBadge({ label, color, className }: StatusBadgeProps) {
  const c = STATUS_COLORS[color]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        c.bg, c.text, className,
      )}
    >
      {label}
    </span>
  )
}
