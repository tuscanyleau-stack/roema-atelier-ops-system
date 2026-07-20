'use client'
import Avatar from '@/components/shared/Avatar'
import StatusBadge from '@/components/shared/StatusBadge'
import { BRIDES } from '@/lib/data'

interface BridesListProps {
  onSelect: (id: number) => void
}

export default function BridesList({ onSelect }: BridesListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-gray-900">Brides</h1>
        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          + Add bride
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {BRIDES.map((bride) => (
          <button
            key={bride.id}
            onClick={() => onSelect(bride.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Avatar initials={bride.initials} color={bride.statusColor} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{bride.name}</p>
              <p className="text-[10px] text-gray-400">{bride.location} · Wedding {bride.weddingDate}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <StatusBadge label={bride.status} color={bride.statusColor} />
              <p className="text-[10px] text-gray-400 mt-1">{bride.paymentPercent}% paid</p>
            </div>
            <span className="text-gray-300 text-xs">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
