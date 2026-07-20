'use client'
import { ViewType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PortalSwitcherProps {
  current: ViewType
  onChange: (v: ViewType) => void
}

const PORTALS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'roema',    label: 'Roéma',    icon: '👑' },
  { id: 'designer', label: 'Designer', icon: '🪡' },
  { id: 'bride',    label: 'Bride',    icon: '💎' },
]

export default function PortalSwitcher({ current, onChange }: PortalSwitcherProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs text-gray-400 mr-1">Portal:</span>
      {PORTALS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors',
            current === p.id
              ? 'bg-gray-100 text-gray-900 font-medium border-gray-300'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50',
          )}
        >
          <span>{p.icon}</span>
          {p.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        5 automations active
      </div>
    </div>
  )
}
