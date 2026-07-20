'use client'
import { RoemaNav } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SidebarProps {
  current: RoemaNav
  onChange: (nav: RoemaNav) => void
  prospectCount: number
}

const NAV_ITEMS: { id: RoemaNav; label: string; icon: string; badge?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard',      icon: '▦'  },
  { id: 'prospects', label: 'Prospects',       icon: '📱', badge: true },
  { id: 'brides',    label: 'Brides',          icon: '♡'  },
  { id: 'books',     label: 'Books',           icon: '📖' },
  { id: 'team',      label: 'Team & settings', icon: '👥' },
]

export default function Sidebar({ current, onChange, prospectCount }: SidebarProps) {
  return (
    <div className="w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="px-3.5 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-800">Roéma Atelier</p>
        <p className="text-[10px] text-gray-400">Master portal</p>
      </div>

      <nav className="flex-1 py-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left transition-colors',
              current === item.id
                ? 'bg-white text-gray-900 font-medium border-r-2 border-amber-500'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
            )}
          >
            <span className="text-sm">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && prospectCount > 0 && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                {prospectCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3.5 py-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-600">
          <span>⚡</span> WA auto-intake on
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-600">
          <span>✉️</span> Alert emails active
        </div>
      </div>
    </div>
  )
}
