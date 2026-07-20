'use client'
import Avatar from '@/components/shared/Avatar'
import StatusBadge from '@/components/shared/StatusBadge'
import { BRIDES, OVERDUE_ITEMS, ACTIVITY_FEED, COMMS_GAPS, LOGISTICS, TEAM_TRAVEL, CALENDAR_EVENTS } from '@/lib/data'
import { formatCurrency, STATUS_COLORS } from '@/lib/utils'
import { StatusColor } from '@/lib/types'

const ACTIVITY_COLORS: Record<string, StatusColor> = {
  design: 'blue', payment: 'amber', alert: 'red',
  prospect: 'teal', logistics: 'coral', milestone: 'green',
}

export default function Dashboard() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
        <span className="text-xs text-gray-400">May 11, 2026</span>
      </div>

      {/* Risk Banner */}
      {OVERDUE_ITEMS.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1.5">
            ⚠️ {OVERDUE_ITEMS.length} item{OVERDUE_ITEMS.length > 1 ? 's' : ''} overdue — email alerts auto-sent to PIC
          </p>
          {OVERDUE_ITEMS.map((item, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs py-0.5">
              <StatusBadge label={item.bride} color={item.statusColor} />
              <span className="text-gray-700">{item.item}</span>
              <span className="text-red-700 font-medium">{item.daysOverdue}d overdue</span>
              <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                ✉️ emailed {item.email}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Funnel */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <p className="text-[10px] text-gray-400 mb-2">Pipeline funnel</p>
        <div className="flex overflow-hidden rounded-lg">
          {[
            { label: 'Prospects', count: 3, color: 'amber' as StatusColor, icon: '📱' },
            { label: 'Brief',     count: 2, color: 'blue'  as StatusColor, icon: '📋' },
            { label: 'Production',count: 2, color: 'teal'  as StatusColor, icon: '🧵' },
            { label: 'Fitting',   count: 1, color: 'coral' as StatusColor, icon: '👗' },
            { label: 'Delivered', count: 0, color: 'green' as StatusColor, icon: '📦' },
          ].map((stage, i, arr) => {
            const c = STATUS_COLORS[stage.color]
            return (
              <div key={i} className={`flex-1 ${c.bg} p-2 text-center ${i < arr.length - 1 ? 'border-r border-white' : ''}`}>
                <div className="text-sm mb-0.5">{stage.icon}</div>
                <div className={`text-lg font-semibold ${c.text}`}>{stage.count}</div>
                <div className={`text-[9px] ${c.text}`}>{stage.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Row: Calendar + Revenue */}
      <div className="grid grid-cols-2 gap-4">
        <CalendarWidget />
        <div className="space-y-3">
          <RevenueWidget />
          <PaymentAging />
        </div>
      </div>

      {/* Row: Activity + Comms/Logistics */}
      <div className="grid grid-cols-2 gap-4">
        <ActivityFeed />
        <div className="space-y-3">
          <CommsGapWidget />
          <LogisticsWidget />
        </div>
      </div>

      {/* Team Travel */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <p className="text-[10px] text-gray-400 mb-2">✈️ Team travel</p>
        <div className="grid grid-cols-3 gap-2">
          {TEAM_TRAVEL.map((t, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-2">
              <p className="text-[9px] text-gray-400">{t.dates}</p>
              <p className="text-xs font-medium text-gray-800">{t.city}</p>
              <p className="text-[10px] text-gray-400">{t.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CalendarWidget() {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  // May 2026 starts on Friday → 4 empty leading cells
  const leadingEmpties = 4
  const totalDays = 31

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-2">📅 May 2026</p>
      <div className="grid grid-cols-7 gap-px mb-1">
        {days.map((d) => (
          <div key={d} className="text-center text-[9px] text-gray-300 py-0.5">{d}</div>
        ))}
        {Array.from({ length: leadingEmpties }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const isToday = day === 11
          const evColor = CALENDAR_EVENTS[day]
          const dotColor = evColor ? STATUS_COLORS[evColor as StatusColor].dot : ''
          return (
            <div key={day} className={`text-center text-[10px] rounded cursor-pointer py-0.5 ${isToday ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
              {day}
              {evColor && !isToday && (
                <div className={`w-1 h-1 rounded-full mx-auto mt-px ${dotColor}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="border-t border-gray-100 pt-2 space-y-1">
        <p className="text-[9px] text-gray-400 mb-1">Upcoming</p>
        {[
          { color: 'teal' as StatusColor, label: "Today · Mei Lin: toile fitting" },
          { color: 'amber' as StatusColor, label: "May 15 · Priya: payment due" },
          { color: 'blue' as StatusColor,  label: "May 22 · Team: Jakarta trip" },
        ].map((ev, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[ev.color].dot}`} />
            {ev.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function RevenueWidget() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-2">📊 Revenue</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Contracted', value: '$62k', color: '' },
          { label: 'Collected',  value: '$32.5k', color: 'text-emerald-600' },
          { label: 'Avg margin', value: '38%', color: '' },
          { label: 'Pipeline',   value: '$41k', color: 'text-amber-600' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-2">
            <p className="text-[9px] text-gray-400">{m.label}</p>
            <p className={`text-sm font-semibold text-gray-800 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentAging() {
  const rows = [
    { name: 'Priya Sharma', amount: '$7,000', label: '14d overdue', color: 'text-red-600' },
    { name: 'Mei Lin Tan',  amount: '$5,000', label: 'Due Jun 15',  color: 'text-amber-600' },
    { name: 'Sofia Chen',   amount: '$3,500', label: 'On track',    color: 'text-emerald-600' },
  ]
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-2">⏱ Payment aging</p>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center text-xs py-1 border-b border-gray-50 last:border-0">
          <span className="flex-1 text-gray-700 text-[11px]">{r.name}</span>
          <span className="text-[11px] font-medium text-gray-800 mr-2">{r.amount}</span>
          <span className={`text-[10px] ${r.color}`}>{r.label}</span>
        </div>
      ))}
    </div>
  )
}

function ActivityFeed() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-2">⚡ Activity feed</p>
      <div className="space-y-2">
        {ACTIVITY_FEED.map((item) => {
          const color = ACTIVITY_COLORS[item.type] ?? 'blue'
          const c = STATUS_COLORS[color]
          return (
            <div key={item.id} className="flex gap-2">
              <div className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-700 truncate">{item.text}</p>
                <p className="text-[9px] text-gray-400">{item.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CommsGapWidget() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-2">💬 Communication gaps</p>
      {COMMS_GAPS.map((c, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
          <Avatar initials={c.initials} color={c.statusColor} size="sm" />
          <div className="flex-1">
            <p className="text-[11px] font-medium text-gray-800">{c.bride}</p>
            <p className="text-[9px] text-gray-400">{c.status}</p>
          </div>
          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
            {c.daysAgo} no contact
          </span>
        </div>
      ))}
      <p className="text-[9px] text-gray-400 mt-1.5">ℹ️ Flagged after 5 days of silence</p>
    </div>
  )
}

function LogisticsWidget() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-2">📦 Logistics</p>
      {LOGISTICS.map((l) => (
        <div key={l.id} className="py-1.5 border-b border-gray-50 last:border-0">
          <p className="text-[11px] font-medium text-gray-800">{l.bride}: {l.item}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">{l.courier} {l.trackingNumber}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              l.status === 'delivered'
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {l.status === 'delivered' ? '✓ Delivered' : `In transit · ETA ${l.eta}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
