import { StatusColor } from '@/lib/types'
import { AVATAR_COLORS, cn } from '@/lib/utils'

interface AvatarProps {
  initials: string
  color: StatusColor
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }

export default function Avatar({ initials, color, size = 'md' }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        AVATAR_COLORS[color],
        SIZE_MAP[size],
      )}
    >
      {initials}
    </div>
  )
}
