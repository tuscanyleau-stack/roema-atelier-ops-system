'use client'
import { useState } from 'react'
import Avatar from '@/components/shared/Avatar'
import StatusBadge from '@/components/shared/StatusBadge'
import { BRIDES } from '@/lib/data'
import { BrideTab } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface BrideDetailProps {
  brideId: number
  onBack: () => void
}

const TABS: { id: BrideTab; label: string }[] = [
  { id: 'brief',    label: 'Brief' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'design',   label: 'Design discussion' },
  { id: 'payments', label: 'Payments' },
  { id: 'notes',    label: 'Internal notes' },
]

export default function BrideDetail({ brideId, onBack }: BrideDetailProps) {
  const [activeTab, setActiveTab] = useState<BrideTab>('brief')
  const bride = BRIDES.find((b) => b.id === brideId)
  if (!bride) return null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← Brides
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{bride.name}</span>
        <span className="ml-auto">
          <StatusBadge label={bride.status} color={bride.statusColor} />
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4 pb-3 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              activeTab === t.id
                ? 'bg-gray-100 text-gray-900 font-medium border-gray-200'
                : 'text-gray-400 border-gray-100 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'brief' && <BriefTab bride={bride} />}
      {activeTab === 'timeline' && <TimelineTab bride={bride} />}
      {activeTab === 'design' && <DesignTab bride={bride} />}
      {activeTab === 'payments' && <PaymentsTab bride={bride} />}
      {activeTab === 'notes' && <NotesTab bride={bride} />}
    </div>
  )
}

// ── Brief ──────────────────────────────────────────────
function BriefTab({ bride }: { bride: (typeof BRIDES)[0] }) {
  return (
    <div>
      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed mb-4">
        {bride.brief}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Designer',     value: bride.designer },
          { label: 'Wedding date', value: bride.weddingDate },
          { label: 'Location',     value: bride.location },
          { label: 'Status',       value: bride.status },
        ].map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <p className="text-[9px] text-gray-400 mb-1">{item.label}</p>
            {item.label === 'Status'
              ? <StatusBadge label={item.value} color={bride.statusColor} />
              : <p className="text-xs font-medium text-gray-800">{item.value}</p>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Timeline ───────────────────────────────────────────
function TimelineTab({ bride }: { bride: (typeof BRIDES)[0] }) {
  return (
    <div className="space-y-3">
      {bride.timeline.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${
              step.done    ? 'bg-emerald-500' :
              step.overdue ? 'bg-red-500' :
              step.current ? 'bg-amber-500' :
              'bg-gray-200'
            }`} />
            {i < bride.timeline.length - 1 && (
              <div className="w-px flex-1 min-h-[20px] bg-gray-100 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-1">
            <p className="text-[10px] text-gray-400">{step.date}</p>
            <p className={`text-xs ${
              step.done    ? 'text-gray-400 line-through' :
              step.overdue ? 'text-red-700 font-medium' :
              step.current ? 'text-gray-900 font-medium' :
              'text-gray-700'
            }`}>
              {step.label}
            </p>
            {step.current && !step.overdue && (
              <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                Current milestone
              </span>
            )}
            {step.overdue && (
              <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                ✉️ Overdue — email sent
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Design Discussion ──────────────────────────────────
function DesignTab({ bride }: { bride: (typeof BRIDES)[0] }) {
  const fromColor: Record<string, string> = {
    Putri: 'text-teal-700',
    'Roéma': 'text-amber-700',
    Bride: 'text-blue-700',
  }
  const bubbleBg: Record<string, string> = {
    Putri: 'bg-gray-50',
    'Roéma': 'bg-gray-50',
    Bride: 'bg-blue-50',
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {bride.discussions.map((d, i) => (
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-medium ${fromColor[d.from] ?? 'text-gray-700'}`}>{d.from}</span>
              <span className="text-[9px] text-gray-300">{d.date}</span>
            </div>
            <div className={`rounded-xl px-3 py-2 text-xs text-gray-700 leading-relaxed ${bubbleBg[d.from] ?? 'bg-gray-50'}`}>
              {d.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3 flex gap-2">
        <input
          type="text"
          placeholder="Add a note or message..."
          className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300"
        />
        <button className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">
          📎
        </button>
        <button className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">
          Send
        </button>
      </div>
    </div>
  )
}

// ── Payments ───────────────────────────────────────────
function PaymentsTab({ bride }: { bride: (typeof BRIDES)[0] }) {
  const outstanding = bride.total - bride.paid
  const milestones = [
    { label: 'Deposit (25%)',       amount: bride.total * 0.25, paidIf: bride.paymentPercent >= 25, reminder: '—' },
    { label: '2nd payment (25%)',   amount: bride.total * 0.25, paidIf: bride.paymentPercent >= 50, reminder: 'Auto-sent 7d' },
    { label: '3rd payment (25%)',   amount: bride.total * 0.25, paidIf: bride.paymentPercent >= 75, reminder: 'Scheduled' },
    { label: 'Final payment (25%)', amount: bride.total * 0.25, paidIf: bride.paymentPercent >= 100, reminder: 'Scheduled' },
  ]

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Contract',    value: formatCurrency(bride.total),   color: '' },
          { label: 'Collected',   value: formatCurrency(bride.paid),    color: 'text-emerald-600' },
          { label: 'Outstanding', value: formatCurrency(outstanding),   color: 'text-red-500' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[9px] text-gray-400">{m.label}</p>
            <p className={`text-sm font-semibold text-gray-800 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-1 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${bride.paymentPercent}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 text-right mb-3">{bride.paymentPercent}% collected</p>

      {/* Schedule table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 text-[10px] text-gray-400 gap-2">
          <span>Milestone</span><span>Amount</span><span>Status</span><span>Reminder</span>
        </div>
        {milestones.map((m, i) => (
          <div key={i} className="grid grid-cols-4 px-3 py-2.5 text-xs border-t border-gray-50 gap-2">
            <span className="text-gray-700">{m.label}</span>
            <span className="text-gray-800 font-medium">{formatCurrency(m.amount)}</span>
            <span className={m.paidIf ? 'text-emerald-600' : 'text-gray-400'}>
              {m.paidIf ? '✓ Paid' : 'Pending'}
            </span>
            <span className="text-[10px] text-gray-400">{m.reminder}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Internal Notes ─────────────────────────────────────
function NotesTab({ bride }: { bride: (typeof BRIDES)[0] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
        🔒 Roéma + Designer only
      </div>
      <div className="space-y-3 mb-3">
        {[
          { title: 'KYC profile',  content: bride.kyc },
          { title: 'Gatekeeper',   content: bride.gatekeeper },
        ].map((n, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-500 mb-1">{n.title}</p>
            <p className="text-xs text-gray-700 leading-relaxed">{n.content}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-gray-500 mb-2">Add internal note</p>
        <textarea
          placeholder="Notes, sensitivities, preferences..."
          rows={3}
          className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none bg-white"
        />
        <button className="mt-2 text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors">
          Save note
        </button>
      </div>
    </div>
  )
}
