'use client'
import { useState } from 'react'
import { BRIDES } from '@/lib/data'
import { BridePortalTab } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

// In production: selected bride comes from auth/session
const PORTAL_BRIDE_ID = 1

const TABS: { id: BridePortalTab; label: string }[] = [
  { id: 'timeline', label: 'My timeline' },
  { id: 'design',   label: 'Design board' },
  { id: 'payments', label: 'Payments' },
]

export default function BridePortal() {
  const [activeTab, setActiveTab] = useState<BridePortalTab>('timeline')
  const bride = BRIDES.find((b) => b.id === PORTAL_BRIDE_ID)!

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-100 pb-3 mb-4">
        <h1 className="text-base font-semibold text-gray-900">Hello, {bride.name.split(' ')[0]} 👋</h1>
        <p className="text-[11px] text-gray-400">Roéma Atelier bride portal · Wedding {bride.weddingDate}</p>
      </div>

      {/* Status strip */}
      <div className="bg-amber-50 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-gray-900">Current stage: {bride.status}</p>
          <p className="text-[10px] text-gray-500">Next: Fabric sign-off · Jun 15</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 pb-3 border-b border-gray-100">
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

      {/* Tab content */}
      {activeTab === 'timeline' && <TimelineView bride={bride} />}
      {activeTab === 'design' && <DesignView bride={bride} />}
      {activeTab === 'payments' && <PaymentsView bride={bride} />}
    </div>
  )
}

function TimelineView({ bride }: { bride: (typeof BRIDES)[0] }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-3">Your gown journey</p>
      <div className="space-y-3">
        {bride.timeline.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${
                step.done ? 'bg-emerald-500' : step.current ? 'bg-amber-400' : 'bg-gray-200'
              }`} />
              {i < bride.timeline.length - 1 && (
                <div className="w-px flex-1 min-h-[20px] bg-gray-100 mt-1" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-[10px] text-gray-400">{step.date}</p>
              <p className={`text-xs ${step.done ? 'text-gray-400 line-through' : step.current ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {step.label}
              </p>
              {step.done && <span className="text-[9px] text-emerald-600">Completed</span>}
              {step.current && (
                <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                  We are here ✨
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DesignView({ bride }: { bride: (typeof BRIDES)[0] }) {
  const bubbleBg: Record<string, string> = {
    Putri: 'bg-gray-50',
    'Roéma': 'bg-gray-50',
    Bride: 'bg-blue-50',
  }
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-3">Design conversation</p>
      <div className="space-y-3 mb-4">
        {bride.discussions.map((d, i) => (
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium text-gray-700">{d.from}</span>
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
          placeholder="Send a message or photo to Roéma..."
          className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300"
        />
        <button className="px-3 py-2 rounded-lg border border-gray-200 text-xs hover:bg-gray-50">📎</button>
      </div>
    </div>
  )
}

function PaymentsView({ bride }: { bride: (typeof BRIDES)[0] }) {
  const outstanding = bride.total - bride.paid
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          { label: 'Total investment', value: formatCurrency(bride.total), color: '' },
          { label: 'Outstanding',      value: formatCurrency(outstanding), color: 'text-red-500' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[9px] text-gray-400">{m.label}</p>
            <p className={`text-lg font-semibold text-gray-800 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="h-2 bg-gray-100 rounded-full mb-1 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{ width: `${bride.paymentPercent}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 text-right mb-4">{bride.paymentPercent}% paid</p>

      <div className="bg-amber-50 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-amber-700 mb-1">Next payment due</p>
        <p className="text-lg font-semibold text-red-500">{formatCurrency(bride.total * 0.25)}</p>
        <p className="text-[10px] text-gray-500">Due Jun 15, 2025 · Fabric sign-off milestone</p>
        <p className="text-[10px] text-gray-400 mt-1.5">
          🔔 You will receive a reminder 7, 3, and 1 day before
        </p>
      </div>
    </div>
  )
}
