'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type ViewType = 'roema' | 'designer' | 'bride'
type RoemaNav = 'dashboard' | 'prospects' | 'brides' | 'books' | 'team'

interface Bride {
  id: string
  name: string
  initials: string
  location: string
  status: string
  status_color: string
  designer: string
  wedding_date: string | null
  total: number
  paid: number
  margin: number
  brief: string
  kyc: string
  gatekeeper: string
}

interface Prospect {
  id: string
  name: string
  phone: string
  location: string
  wedding_date: string
  budget: string
  raw_message: string
  status: string
}

const COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-teal-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
  coral: { bg: 'bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-500' },
  green: { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-500' },
}

const AVATARS: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800',
  teal: 'bg-teal-100 text-teal-800',
  blue: 'bg-blue-100 text-blue-800',
  coral: 'bg-orange-100 text-orange-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

const money = (n: number) => '$' + (n || 0).toLocaleString()

function Avatar({ initials, color, sm }: { initials: string; color: string; sm?: boolean }) {
  return (
    <div className={`rounded-full flex items-center justify-center font-medium flex-shrink-0 ${AVATARS[color] || AVATARS.blue} ${sm ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}`}>
      {initials}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const c = COLORS[color] || COLORS.blue
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{label}</span>
}

export default function CRMApp() {
  const [view, setView] = useState<ViewType>('roema')
  const [nav, setNav] = useState<RoemaNav>('dashboard')
  const [brides, setBrides] = useState<Bride[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBride, setSelectedBride] = useState<Bride | null>(null)
  const [showAddBride, setShowAddBride] = useState(false)
  const [showAddProspect, setShowAddProspect] = useState(false)

  async function loadData() {
    setLoading(true)
    const { data: b } = await supabase.from('brides').select('*').order('created_at', { ascending: false })
    const { data: p } = await supabase.from('prospects').select('*').order('created_at', { ascending: false })
    setBrides(b || [])
    setProspects(p || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const totals = brides.reduce((a, b) => ({ total: a.total + (b.total || 0), paid: a.paid + (b.paid || 0) }), { total: 0, paid: 0 })
  const avgMargin = brides.length ? Math.round(brides.reduce((a, b) => a + (b.margin || 0), 0) / brides.length) : 0

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs text-gray-400">Portal:</span>
          {(['roema', 'designer', 'bride'] as ViewType[]).map(p => (
            <button key={p} onClick={() => { setView(p); setNav('dashboard'); setSelectedBride(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === p ? 'bg-gray-100 font-medium border-gray-300 text-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              {p === 'roema' ? '👑 Roéma' : p === 'designer' ? '🪡 Designer' : '💎 Bride'}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected to database
          </div>
        </div>

        <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm min-h-[600px]">
          {view === 'roema' && (
            <div className="w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
              <div className="px-3.5 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-800">Roéma Atelier</p>
                <p className="text-[10px] text-gray-400">Master portal</p>
              </div>
              <nav className="flex-1 py-1">
                {([['dashboard', '▦', 'Dashboard'], ['prospects', '📱', 'Prospects'], ['brides', '♡', 'Brides'], ['books', '📖', 'Books'], ['team', '👥', 'Team']] as [RoemaNav, string, string][]).map(([id, icon, label]) => (
                  <button key={id} onClick={() => { setNav(id); setSelectedBride(null) }}
                    className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left transition-colors ${nav === id ? 'bg-white text-gray-900 font-medium border-r-2 border-amber-500' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <span>{icon}</span><span className="flex-1">{label}</span>
                    {id === 'prospects' && prospects.length > 0 && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{prospects.length}</span>}
                    {id === 'brides' && brides.length > 0 && <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{brides.length}</span>}
                  </button>
                ))}
              </nav>
            </div>
          )}

          <main className="flex-1 p-5 overflow-auto min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
            ) : view === 'roema' ? (
              <>
                {nav === 'dashboard' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h1 className="text-base font-semibold">Dashboard</h1>
                      <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[['Active brides', String(brides.length), ''], ['Contracted', money(totals.total), ''], ['Collected', money(totals.paid), 'text-emerald-600'], ['Avg margin', avgMargin + '%', '']].map(([l, v, c], i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[9px] text-gray-400">{l}</p>
                          <p className={`text-xl font-semibold ${c}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                    {brides.length === 0 && prospects.length === 0 && (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-sm text-gray-500 mb-1">No data yet</p>
                        <p className="text-xs text-gray-400 mb-4">Add your first bride or prospect to get started</p>
                        <button onClick={() => setNav('brides')} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">Add a bride</button>
                      </div>
                    )}
                    {brides.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400">Active brides</div>
                        {brides.map(b => (
                          <button key={b.id} onClick={() => { setNav('brides'); setSelectedBride(b) }} className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-50 hover:bg-gray-50 text-left">
                            <Avatar initials={b.initials || b.name.slice(0, 2).toUpperCase()} color={b.status_color} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{b.name}</p>
                              <p className="text-[10px] text-gray-400">{b.location} · {b.wedding_date || 'No date set'}</p>
                            </div>
                            <Badge label={b.status} color={b.status_color} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {nav === 'prospects' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-base font-semibold">Prospects</h1>
                        <p className="text-[11px] text-gray-400">Incoming enquiries</p>
                      </div>
                      <button onClick={() => setShowAddProspect(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800">+ Add prospect</button>
                    </div>
                    {showAddProspect && <AddProspectForm onDone={() => { setShowAddProspect(false); loadData() }} onCancel={() => setShowAddProspect(false)} />}
                    {prospects.length === 0 && !showAddProspect && (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-sm text-gray-500">No prospects yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add your first enquiry above</p>
                      </div>
                    )}
                    {prospects.map(p => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-medium">{p.name.slice(0, 2).toUpperCase()}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">{p.name}</span><Badge label={p.status} color="amber" /></div>
                            <p className="text-[10px] text-gray-400">{p.phone}</p>
                          </div>
                        </div>
                        {p.raw_message && <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 italic mb-3">&ldquo;{p.raw_message}&rdquo;</div>}
                        <div className="flex flex-wrap gap-1.5">
                          {p.location && <span className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">📍 {p.location}</span>}
                          {p.wedding_date && <span className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">📅 {p.wedding_date}</span>}
                          {p.budget && <span className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">💰 {p.budget}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {nav === 'brides' && !selectedBride && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-base font-semibold">Brides</h1>
                      <button onClick={() => setShowAddBride(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800">+ Add bride</button>
                    </div>
                    {showAddBride && <AddBrideForm onDone={() => { setShowAddBride(false); loadData() }} onCancel={() => setShowAddBride(false)} />}
                    {brides.length === 0 && !showAddBride && (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-sm text-gray-500">No brides yet</p>
                        <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add bride&rdquo; to create your first record</p>
                      </div>
                    )}
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                      {brides.map(b => (
                        <button key={b.id} onClick={() => setSelectedBride(b)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                          <Avatar initials={b.initials || b.name.slice(0, 2).toUpperCase()} color={b.status_color} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{b.name}</p>
                            <p className="text-[10px] text-gray-400">{b.location} · {b.wedding_date || 'No date'}</p>
                          </div>
                          <div className="text-right">
                            <Badge label={b.status} color={b.status_color} />
                            <p className="text-[10px] text-gray-400 mt-1">{b.total ? Math.round((b.paid / b.total) * 100) : 0}% paid</p>
                          </div>
                          <span className="text-gray-300">›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {nav === 'brides' && selectedBride && (
                  <BrideDetail bride={selectedBride} onBack={() => setSelectedBride(null)} onSaved={loadData} />
                )}

                {nav === 'books' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-base font-semibold">Books</h1>
                      <span className="text-[10px] text-gray-400">🔒 Admin only</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[['Total contracted', money(totals.total), ''], ['Collected', money(totals.paid), 'text-emerald-600'], ['Outstanding', money(totals.total - totals.paid), 'text-red-500']].map(([l, v, c], i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">{l}</p><p className={`text-xl font-semibold ${c}`}>{v}</p></div>
                      ))}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400 gap-2">
                        <span className="col-span-2">Bride</span><span>Contract</span><span>Paid</span><span>Margin</span>
                      </div>
                      {brides.map(b => (
                        <div key={b.id} className="grid grid-cols-5 items-center px-4 py-3 border-t border-gray-50 gap-2">
                          <div className="col-span-2 flex items-center gap-2"><Avatar initials={b.initials || b.name.slice(0, 2).toUpperCase()} color={b.status_color} sm /><span className="text-xs">{b.name}</span></div>
                          <span className="text-xs">{money(b.total)}</span>
                          <span className="text-xs text-emerald-600">{money(b.paid)}</span>
                          <span className="text-xs">{b.margin || 0}%</span>
                        </div>
                      ))}
                      {brides.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">No financial data yet</div>}
                    </div>
                  </div>
                )}

                {nav === 'team' && (
                  <div className="space-y-4">
                    <h1 className="text-base font-semibold">Team &amp; settings</h1>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-medium mb-3">Members</p>
                      {[{ n: 'You (Admin)', e: 'hi@roemaatelier.com', r: 'Roéma admin', i: 'RA', c: 'amber' }, { n: 'Putri Rahayu', e: 'putri@designer.id', r: 'Designer', i: 'PR', c: 'teal' }].map((m, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                          <Avatar initials={m.i} color={m.c} />
                          <div className="flex-1"><p className="text-xs font-medium">{m.n}</p><p className="text-[10px] text-gray-400">{m.e}</p></div>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{m.r}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-medium mb-3">Invite member</p>
                      <div className="flex gap-2">
                        <input type="email" placeholder="Email address" className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                        <select className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white"><option>Roéma admin</option><option>Designer</option></select>
                        <button className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Invite</button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Login and permissions coming in the next update</p>
                    </div>
                  </div>
                )}
              </>
            ) : view === 'designer' ? (
              <div>
                <h1 className="text-base font-semibold mb-1">Good morning, Putri</h1>
                <p className="text-[11px] text-gray-400 mb-4">Designer portal</p>
                {brides.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">No brides assigned yet</div>
                ) : brides.map(b => (
                  <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar initials={b.initials || b.name.slice(0, 2).toUpperCase()} color={b.status_color} />
                        <div><p className="text-sm font-medium">{b.name}</p><p className="text-[10px] text-gray-400">{b.wedding_date || 'No date'}</p></div>
                      </div>
                      <Badge label={b.status} color={b.status_color} />
                    </div>
                    {b.brief && <p className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2">{b.brief}</p>}
                    {b.gatekeeper && <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-2">🔒 Gatekeeper: {b.gatekeeper}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {brides.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">No bride record to display</div>
                ) : (
                  <>
                    <div className="border-b border-gray-100 pb-3 mb-4">
                      <h1 className="text-base font-semibold">Hello, {brides[0].name.split(' ')[0]} 👋</h1>
                      <p className="text-[11px] text-gray-400">Roéma Atelier · {brides[0].wedding_date || 'Date TBC'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <p className="text-xs font-medium">Current stage: {brides[0].status}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">Total</p><p className="text-lg font-semibold">{money(brides[0].total)}</p></div>
                      <div className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">Outstanding</p><p className="text-lg font-semibold text-red-500">{money(brides[0].total - brides[0].paid)}</p></div>
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function AddBrideForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', location: '', wedding_date: '', designer: '', total: '', paid: '', margin: '', status: 'Brief confirmed', status_color: 'blue', brief: '', kyc: '', gatekeeper: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!f.name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    const initials = f.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const { error } = await supabase.from('brides').insert({
      name: f.name.trim(),
      initials,
      location: f.location || null,
      wedding_date: f.wedding_date || null,
      designer: f.designer || null,
      total: Number(f.total) || 0,
      paid: Number(f.paid) || 0,
      margin: Number(f.margin) || 0,
      status: f.status,
      status_color: f.status_color,
      brief: f.brief || null,
      kyc: f.kyc || null,
      gatekeeper: f.gatekeeper || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    onDone()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <p className="text-sm font-medium mb-3">New bride</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="text-[10px] text-gray-400 block mb-1">Name *</label><input className={input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Full name" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} placeholder="Singapore" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input type="date" className={input} value={f.wedding_date} onChange={e => setF({ ...f, wedding_date: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Designer</label><input className={input} value={f.designer} onChange={e => setF({ ...f, designer: e.target.value })} placeholder="Putri Rahayu" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Status</label>
          <select className={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            <option>Brief confirmed</option><option>Design review</option><option>Production</option><option>Fitting stage</option><option>Delivered</option>
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Status colour</label>
          <select className={input} value={f.status_color} onChange={e => setF({ ...f, status_color: e.target.value })}>
            <option value="blue">Blue</option><option value="amber">Amber</option><option value="teal">Teal</option><option value="coral">Coral</option><option value="green">Green</option>
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Contract total</label><input type="number" className={input} value={f.total} onChange={e => setF({ ...f, total: e.target.value })} placeholder="20000" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Amount paid</label><input type="number" className={input} value={f.paid} onChange={e => setF({ ...f, paid: e.target.value })} placeholder="5000" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Margin %</label><input type="number" className={input} value={f.margin} onChange={e => setF({ ...f, margin: e.target.value })} placeholder="38" /></div>
      </div>
      <div className="space-y-3 mb-3">
        <div><label className="text-[10px] text-gray-400 block mb-1">Design brief</label><textarea rows={2} className={input + ' resize-none'} value={f.brief} onChange={e => setF({ ...f, brief: e.target.value })} placeholder="Silhouette, fabric, colourway…" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">KYC / internal notes 🔒</label><textarea rows={2} className={input + ' resize-none'} value={f.kyc} onChange={e => setF({ ...f, kyc: e.target.value })} placeholder="Preferences, sensitivities…" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Gatekeeper 🔒</label><input className={input} value={f.gatekeeper} onChange={e => setF({ ...f, gatekeeper: e.target.value })} placeholder="Who approves decisions" /></div>
      </div>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save bride'}</button>
        <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )
}

function AddProspectForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', phone: '', location: '', wedding_date: '', budget: '', raw_message: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!f.name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('prospects').insert({
      name: f.name.trim(), phone: f.phone || null, location: f.location || null,
      wedding_date: f.wedding_date || null, budget: f.budget || null, raw_message: f.raw_message || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    onDone()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <p className="text-sm font-medium mb-3">New prospect</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="text-[10px] text-gray-400 block mb-1">Name *</label><input className={input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Phone / WhatsApp</label><input className={input} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+60…" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input className={input} value={f.wedding_date} onChange={e => setF({ ...f, wedding_date: e.target.value })} placeholder="Mar 2027" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Budget</label><input className={input} value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })} placeholder="SGD 15k" /></div>
      </div>
      <div className="mb-3"><label className="text-[10px] text-gray-400 block mb-1">Original message</label><textarea rows={2} className={input + ' resize-none'} value={f.raw_message} onChange={e => setF({ ...f, raw_message: e.target.value })} placeholder="Paste their enquiry here" /></div>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save prospect'}</button>
        <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )
}

function BrideDetail({ bride, onBack, onSaved }: { bride: Bride; onBack: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState('brief')
  const [f, setF] = useState(bride)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('brides').update({
      name: f.name, location: f.location, wedding_date: f.wedding_date || null, designer: f.designer,
      total: Number(f.total) || 0, paid: Number(f.paid) || 0, margin: Number(f.margin) || 0,
      status: f.status, status_color: f.status_color, brief: f.brief, kyc: f.kyc, gatekeeper: f.gatekeeper,
    }).eq('id', bride.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved ✓')
    setTimeout(() => setMsg(''), 2000)
    if (!error) onSaved()
  }

  async function remove() {
    if (!confirm('Delete this bride? This cannot be undone.')) return
    await supabase.from('brides').delete().eq('id', bride.id)
    onSaved(); onBack()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">← Brides</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{bride.name}</span>
        <span className="ml-auto flex items-center gap-2">
          {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
          <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
        </span>
      </div>
      <div className="flex gap-1.5 mb-4 pb-3 border-b border-gray-100">
        {['brief', 'payments', 'notes'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 text-xs rounded-lg border capitalize ${tab === t ? 'bg-gray-100 font-medium border-gray-200' : 'text-gray-400 border-gray-100 hover:bg-gray-50'}`}>
            {t === 'notes' ? 'Internal notes' : t}
          </button>
        ))}
      </div>

      {tab === 'brief' && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] text-gray-400 block mb-1">Name</label><input className={input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location || ''} onChange={e => setF({ ...f, location: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input type="date" className={input} value={f.wedding_date || ''} onChange={e => setF({ ...f, wedding_date: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Designer</label><input className={input} value={f.designer || ''} onChange={e => setF({ ...f, designer: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Status</label>
            <select className={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              <option>Brief confirmed</option><option>Design review</option><option>Production</option><option>Fitting stage</option><option>Delivered</option>
            </select>
          </div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Status colour</label>
            <select className={input} value={f.status_color} onChange={e => setF({ ...f, status_color: e.target.value })}>
              <option value="blue">Blue</option><option value="amber">Amber</option><option value="teal">Teal</option><option value="coral">Coral</option><option value="green">Green</option>
            </select>
          </div>
          <div className="col-span-2"><label className="text-[10px] text-gray-400 block mb-1">Design brief</label><textarea rows={4} className={input + ' resize-none'} value={f.brief || ''} onChange={e => setF({ ...f, brief: e.target.value })} /></div>
        </div>
      )}

      {tab === 'payments' && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div><label className="text-[10px] text-gray-400 block mb-1">Contract total</label><input type="number" className={input} value={f.total || 0} onChange={e => setF({ ...f, total: Number(e.target.value) })} /></div>
            <div><label className="text-[10px] text-gray-400 block mb-1">Amount paid</label><input type="number" className={input} value={f.paid || 0} onChange={e => setF({ ...f, paid: Number(e.target.value) })} /></div>
            <div><label className="text-[10px] text-gray-400 block mb-1">Margin %</label><input type="number" className={input} value={f.margin || 0} onChange={e => setF({ ...f, margin: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[['Contract', money(f.total), ''], ['Collected', money(f.paid), 'text-emerald-600'], ['Outstanding', money((f.total || 0) - (f.paid || 0)), 'text-red-500']].map(([l, v, c], i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5"><p className="text-[9px] text-gray-400">{l}</p><p className={`text-sm font-semibold ${c}`}>{v}</p></div>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${f.total ? Math.min(100, (f.paid / f.total) * 100) : 0}%` }} />
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div>
          <p className="text-xs text-gray-400 mb-3">🔒 Visible to Roéma + Designer only</p>
          <div className="mb-3"><label className="text-[10px] text-gray-400 block mb-1">KYC profile</label><textarea rows={4} className={input + ' resize-none'} value={f.kyc || ''} onChange={e => setF({ ...f, kyc: e.target.value })} /></div>
          <div className="mb-4"><label className="text-[10px] text-gray-400 block mb-1">Gatekeeper</label><input className={input} value={f.gatekeeper || ''} onChange={e => setF({ ...f, gatekeeper: e.target.value })} /></div>
          <button onClick={remove} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete bride</button>
        </div>
      )}
    </div>
  )
}
