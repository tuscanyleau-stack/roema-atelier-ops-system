'use client'
import Avatar from '@/components/shared/Avatar'
import StatusBadge from '@/components/shared/StatusBadge'
import { BRIDES, OVERDUE_ITEMS } from '@/lib/data'

export default function DesignerPortal() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Good morning, Putri</h1>
          <p className="text-[11px] text-gray-400">Roéma Atelier · Designer portal</p>
        </div>
        {OVERDUE_ITEMS.length > 0 && (
          <span className="text-[10px] bg-red-50 text-red-700 px-2.5 py-1 rounded-full flex items-center gap-1">
            ✉️ {OVERDUE_ITEMS.length} alert email{OVERDUE_ITEMS.length > 1 ? 's' : ''} received
          </span>
        )}
      </div>

      {/* Overdue alert */}
      {OVERDUE_ITEMS.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1.5">
            ⚠️ {OVERDUE_ITEMS.length} items need your attention
          </p>
          {OVERDUE_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-0.5 text-red-700">
              <StatusBadge label={item.bride} color={item.statusColor} />
              <span>{item.item} — {item.daysOverdue}d overdue</span>
            </div>
          ))}
        </div>
      )}

      {/* Today's action */}
      <div className="bg-amber-50 border-l-2 border-amber-400 rounded-r-xl p-3 mb-4">
        <p className="text-[10px] text-amber-600 mb-1">🔔 Action needed today</p>
        <p className="text-sm font-medium text-gray-900">Mei Lin Tan — Toile fitting (May 11)</p>
        <p className="text-xs text-gray-500">Ensure toile is ready and measurements confirmed before session.</p>
      </div>

      {/* My brides */}
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">My brides</p>
      <div className="space-y-3">
        {BRIDES.map((bride) => {
          const nextStep = bride.timeline.find((t) => !t.done)
          const lastMessage = bride.discussions[bride.discussions.length - 1]

          return (
            <div key={bride.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar initials={bride.initials} color={bride.statusColor} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bride.name}</p>
                    <p className="text-[10px] text-gray-400">{bride.weddingDate}</p>
                  </div>
                </div>
                <StatusBadge label={bride.status} color={bride.statusColor} />
              </div>

              <div className="mb-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Next milestone</p>
                <p className="text-xs font-medium text-gray-800">
                  {nextStep?.label ?? 'All complete'}
                  {nextStep && <span className="font-normal text-gray-400"> · {nextStep.date}</span>}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-2 mb-2">
                <p className="text-[10px] text-gray-400">Latest message</p>
                <p className="text-xs text-gray-600">
                  {lastMessage.from}: "{lastMessage.text.slice(0, 60)}..."
                </p>
              </div>

              {bride.id === 1 && (
                <div className="border-t border-gray-100 pt-2 text-[10px] text-gray-400 flex items-center gap-1">
                  🔒 Gatekeeper: Henry Tan (father) approves all decisions first.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
