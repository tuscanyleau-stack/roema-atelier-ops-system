'use client'
import Avatar from '@/components/shared/Avatar'
import { TEAM_MEMBERS, NOTIFICATION_RULES, BRIDES } from '@/lib/data'
import { STATUS_COLORS } from '@/lib/utils'

export default function Team() {
  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold text-gray-900">Team & settings</h1>

      {/* Members */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400">Members</div>
        {TEAM_MEMBERS.map((m, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
            <Avatar initials={m.initials} color={m.color} />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">{m.name}</p>
              <p className="text-[10px] text-gray-400">{m.email}</p>
            </div>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{m.role}</span>
            {m.role !== 'Roéma admin' && (
              <button className="text-[10px] text-red-500 px-2 py-1 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-700 mb-3">Invite team member</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email address"
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300"
          />
          <select className="text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-700">
            <option>Roéma admin</option>
            <option>Designer</option>
          </select>
          <button className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Invite
          </button>
        </div>
      </div>

      {/* Notification rules */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-700 mb-3">🔔 Auto-notification rules</p>
        <div className="space-y-2">
          {NOTIFICATION_RULES.map((rule, i) => {
            const c = STATUS_COLORS[rule.color]
            return (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${c.dot}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">{rule.title}</p>
                  <p className="text-[10px] text-gray-400">{rule.recipients} · {rule.trigger}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>● active</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bride portal access */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-700 mb-3">Bride portal access</p>
        {BRIDES.map((b) => (
          <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <Avatar initials={b.initials} color={b.statusColor} size="sm" />
            <span className="flex-1 text-xs text-gray-800">{b.name}</span>
            <span className="text-[10px] text-gray-400">Portal link</span>
            <button className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-1">
              📋 Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
