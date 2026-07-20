'use client'
import Avatar from '@/components/shared/Avatar'
import StatusBadge from '@/components/shared/StatusBadge'
import { BRIDES } from '@/lib/data'
import { formatCurrency } from '@/lib/utils'

export default function Books() {
  const totals = BRIDES.reduce(
    (acc, b) => ({ total: acc.total + b.total, paid: acc.paid + b.paid }),
    { total: 0, paid: 0 },
  )
  const avgMargin = Math.round(BRIDES.reduce((a, b) => a + b.margin, 0) / BRIDES.length)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-gray-900">Books</h1>
        <span className="text-[10px] text-gray-400 flex items-center gap-1">🔒 Admin only</span>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total contracted', value: formatCurrency(totals.total), color: '' },
          { label: 'Collected',        value: formatCurrency(totals.paid),  color: 'text-emerald-600' },
          { label: 'Avg net margin',   value: `${avgMargin}%`,              color: '' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[9px] text-gray-400">{m.label}</p>
            <p className={`text-xl font-semibold text-gray-800 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Bride table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400 gap-2">
          <span className="col-span-2">Bride</span>
          <span>Contract</span>
          <span>Paid</span>
          <span>Outstanding</span>
          <span>Margin</span>
        </div>
        {BRIDES.map((bride) => (
          <div key={bride.id} className="grid grid-cols-6 items-center px-4 py-3 border-t border-gray-50 gap-2">
            <div className="col-span-2 flex items-center gap-2">
              <Avatar initials={bride.initials} color={bride.statusColor} size="sm" />
              <span className="text-xs text-gray-800">{bride.name.split(' ')[0]}</span>
            </div>
            <span className="text-xs text-gray-700">{formatCurrency(bride.total)}</span>
            <span className="text-xs text-emerald-600">{formatCurrency(bride.paid)}</span>
            <span className="text-xs text-red-500">{formatCurrency(bride.total - bride.paid)}</span>
            <span className="text-xs text-gray-700">{bride.margin}%</span>
          </div>
        ))}
        {/* Total row */}
        <div className="grid grid-cols-6 items-center px-4 py-3 border-t border-gray-200 bg-gray-50 gap-2 font-medium">
          <span className="col-span-2 text-xs text-gray-700">Total</span>
          <span className="text-xs text-gray-700">{formatCurrency(totals.total)}</span>
          <span className="text-xs text-emerald-600">{formatCurrency(totals.paid)}</span>
          <span className="text-xs text-red-500">{formatCurrency(totals.total - totals.paid)}</span>
          <span className="text-xs text-gray-700">{avgMargin}%</span>
        </div>
      </div>
    </div>
  )
}
