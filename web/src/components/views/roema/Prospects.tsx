'use client'
import StatusBadge from '@/components/shared/StatusBadge'
import { PROSPECTS } from '@/lib/data'
import { getProspectStatusConfig } from '@/lib/utils'

export default function Prospects() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Prospects</h1>
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
            <span className="text-green-500">●</span>
            Auto-captured from WhatsApp Business
          </p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          ⚡ AI extraction active
        </span>
      </div>

      <div className="space-y-3">
        {PROSPECTS.map((p) => {
          const statusCfg = getProspectStatusConfig(p.status)
          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    <StatusBadge label={statusCfg.label} color={statusCfg.color} />
                  </div>
                  <p className="text-[10px] text-gray-400">{p.phone} · received {p.receivedAt}</p>
                </div>
                <span className="text-xs text-green-600">📱 WA</span>
              </div>

              {/* Raw message */}
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 italic mb-3">
                "{p.rawMessage}"
              </div>

              {/* Extracted fields */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { icon: '📍', value: p.location },
                  { icon: '📅', value: p.weddingDate },
                  { icon: '💰', value: p.budget },
                ].map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                  >
                    {tag.icon} {tag.value}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button className="text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Reply on WA
                </button>
                <button className="text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Book brief call
                </button>
                <button className="ml-auto text-[11px] px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                  Convert to bride →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
