'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/components/AuthGate'

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

interface TeamProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  bride_id: string | null
}

interface Milestone {
  id: string
  bride_id: string
  label: string
  due_date: string | null
  done: boolean
  sort_order: number
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

const ROLE_LABELS: Record<string, string> = {
  roema_admin: 'Roéma admin',
  designer: 'Designer',
  bride: 'Bride',
}

const ROLE_COLORS: Record<string, string> = {
  roema_admin: 'amber',
  designer: 'teal',
  bride: 'blue',
}

const STATUSES = ['Brief confirmed', 'Design review', 'Production', 'Fitting stage', 'Delivered']

const STATUS_STAGE: Record<string, { color: string; icon: string }> = {
  'Brief confirmed': { color: 'blue', icon: '📋' },
  'Design review': { color: 'amber', icon: '✎' },
  'Production': { color: 'teal', icon: '🧵' },
  'Fitting stage': { color: 'coral', icon: '👗' },
  'Delivered': { color: 'green', icon: '📦' },
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const money = (n: number) => '$' + (n || 0).toLocaleString()

function initialsOf(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayKey(): string {
  const n = new Date()
  return ymd(n.getFullYear(), n.getMonth(), n.getDate())
}

function addDaysKey(days: number): string {
  const n = new Date()
  n.setDate(n.getDate() + days)
  return ymd(n.getFullYear(), n.getMonth(), n.getDate())
}

function prettyDate(d: string | null): string {
  if (!d) return 'No date set'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function shortDate(d: string | null): string {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function daysBetween(fromKey: string, toDateKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number)
  const [y2, m2, d2] = toDateKey.split('-').map(Number)
  const a = new Date(y1, m1 - 1, d1).getTime()
  const b = new Date(y2, m2 - 1, d2).getTime()
  return Math.round((b - a) / 86400000)
}

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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || '—'}</p>
    </div>
  )
}

function Panel({ title, icon, action, children }: { title: string; icon?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          {icon && <span className="text-xs">{icon}</span>}{title}
        </p>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function CRMApp({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'roema_admin'
  const isDesigner = profile.role === 'designer'
  const isBride = profile.role === 'bride'

  const [view, setView] = useState<ViewType>(isAdmin ? 'roema' : isDesigner ? 'designer' : 'bride')
  const [nav, setNav] = useState<RoemaNav>('dashboard')
  const [brides, setBrides] = useState<Bride[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBride, setSelectedBride] = useState<Bride | null>(null)
  const [previewBrideId, setPreviewBrideId] = useState<string>('')
  const [showAddBride, setShowAddBride] = useState(false)
  const [showAddProspect, setShowAddProspect] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: b } = await supabase.from('brides').select('*').order('created_at', { ascending: false })
    setBrides((b as Bride[]) || [])
    const { data: m } = await supabase.from('timeline_steps').select('*').order('due_date', { ascending: true })
    setMilestones((m as Milestone[]) || [])
    if (isAdmin) {
      const { data: p } = await supabase.from('prospects').select('*').order('created_at', { ascending: false })
      setProspects((p as Prospect[]) || [])
    }
    setLoading(false)
  }, [isAdmin])

  useEffect(() => { loadData() }, [loadData])

  const navItems: [RoemaNav, string, string][] = [
    ['dashboard', '▦', 'Dashboard'],
    ['prospects', '📱', 'Prospects'],
    ['brides', '♡', 'Brides'],
    ['books', '📖', 'Books'],
    ['team', '👥', 'Team'],
  ]

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {isAdmin ? (
            <>
              <span className="text-xs text-gray-400">View as:</span>
              {(['roema', 'designer', 'bride'] as ViewType[]).map(p => (
                <button key={p} onClick={() => { setView(p); setNav('dashboard'); setSelectedBride(null) }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === p ? 'bg-gray-100 font-medium border-gray-300 text-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  {p === 'roema' ? '👑 Roéma' : p === 'designer' ? '🪡 Designer' : '💎 Bride'}
                </button>
              ))}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar initials={initialsOf(profile.full_name || profile.email)} color={ROLE_COLORS[profile.role]} />
              <div>
                <p className="text-xs font-medium text-gray-800">{profile.full_name || profile.email}</p>
                <p className="text-[10px] text-gray-400">{ROLE_LABELS[profile.role]}</p>
              </div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-gray-400 hidden sm:inline">{profile.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
              Sign out
            </button>
          </div>
        </div>

        <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm min-h-[600px]">
          {view === 'roema' && isAdmin && (
            <div className="w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
              <div className="px-3.5 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-800">Roéma Atelier</p>
                <p className="text-[10px] text-gray-400">Master portal</p>
              </div>
              <nav className="flex-1 py-1">
                {navItems.map(([id, icon, label]) => (
                  <button key={id} onClick={() => { setNav(id); setSelectedBride(null) }}
                    className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left transition-colors ${nav === id ? 'bg-white text-gray-900 font-medium border-r-2 border-amber-500' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <span>{icon}</span><span className="flex-1">{label}</span>
                    {id === 'prospects' && prospects.length > 0 && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{prospects.length}</span>}
                    {id === 'brides' && brides.length > 0 && <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{brides.length}</span>}
                  </button>
                ))}
              </nav>
              <div className="px-3.5 py-3 border-t border-gray-200">
                <p className="text-[9px] text-gray-400">Signed in as</p>
                <p className="text-[10px] text-gray-600 truncate">{profile.full_name || 'Admin'}</p>
              </div>
            </div>
          )}

          <main className="flex-1 p-5 overflow-auto min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
            ) : view === 'roema' && isAdmin ? (
              <>
                {nav === 'dashboard' && (
                  <Dashboard
                    brides={brides}
                    prospects={prospects}
                    milestones={milestones}
                    onOpenBride={b => { setNav('brides'); setSelectedBride(b) }}
                    onGoto={setNav}
                    onRefresh={loadData}
                  />
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
                      </div>
                    )}
                    {prospects.map(p => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-medium">{initialsOf(p.name)}</div>
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
                      </div>
                    )}
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                      {brides.map(b => {
                        const mine = milestones.filter(m => m.bride_id === b.id)
                        const overdue = mine.filter(m => !m.done && m.due_date && m.due_date < todayKey()).length
                        return (
                          <button key={b.id} onClick={() => setSelectedBride(b)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                            <Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium flex items-center gap-2">
                                {b.name}
                                {overdue > 0 && <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">{overdue} overdue</span>}
                              </p>
                              <p className="text-[10px] text-gray-400">{b.location || 'No location'} · {prettyDate(b.wedding_date)}</p>
                            </div>
                            <div className="text-right">
                              <Badge label={b.status} color={b.status_color} />
                              <p className="text-[10px] text-gray-400 mt-1">{b.total ? Math.round((b.paid / b.total) * 100) : 0}% paid</p>
                            </div>
                            <span className="text-gray-300">›</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {nav === 'brides' && selectedBride && (
                  <BrideDetail bride={selectedBride} onBack={() => setSelectedBride(null)} onSaved={loadData} canDelete canSeeMoney />
                )}

                {nav === 'books' && <Books brides={brides} />}

                {nav === 'team' && <TeamTab brides={brides} currentUserId={profile.id} />}
              </>
            ) : view === 'designer' ? (
              <DesignerPortal
                brides={brides}
                milestones={milestones}
                profile={profile}
                isDesigner={isDesigner}
                selectedBride={selectedBride}
                setSelectedBride={setSelectedBride}
                onSaved={loadData}
              />
            ) : (
              <BridePortal
                brides={brides}
                milestones={milestones}
                isRealBride={isBride}
                profile={profile}
                previewBrideId={previewBrideId}
                setPreviewBrideId={setPreviewBrideId}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ brides, prospects, milestones, onOpenBride, onGoto, onRefresh }: {
  brides: Bride[]
  prospects: Prospect[]
  milestones: Milestone[]
  onOpenBride: (b: Bride) => void
  onGoto: (n: RoemaNav) => void
  onRefresh: () => void
}) {
  const today = todayKey()
  const in7 = addDaysKey(7)
  const in30 = addDaysKey(30)

  const brideById = useMemo(() => {
    const map: Record<string, Bride> = {}
    brides.forEach(b => { map[b.id] = b })
    return map
  }, [brides])

  const totals = brides.reduce((a, b) => ({ total: a.total + (b.total || 0), paid: a.paid + (b.paid || 0) }), { total: 0, paid: 0 })
  const avgMargin = brides.length ? Math.round(brides.reduce((a, b) => a + (b.margin || 0), 0) / brides.length) : 0

  const overdue = milestones
    .filter(m => !m.done && m.due_date && m.due_date < today && brideById[m.bride_id])
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

  const dueSoon = milestones
    .filter(m => !m.done && m.due_date && m.due_date >= today && m.due_date <= in7 && brideById[m.bride_id])
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

  const upcoming = milestones
    .filter(m => !m.done && m.due_date && m.due_date >= today && m.due_date <= in30 && brideById[m.bride_id])
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 8)

  const noTimeline = brides.filter(b => !milestones.some(m => m.bride_id === b.id))

  const weddings = brides
    .filter(b => b.wedding_date && b.wedding_date >= today)
    .sort((a, b) => (a.wedding_date || '').localeCompare(b.wedding_date || ''))
    .slice(0, 5)

  const outstanding = brides
    .filter(b => (b.total || 0) - (b.paid || 0) > 0)
    .sort((a, b) => ((b.total || 0) - (b.paid || 0)) - ((a.total || 0) - (a.paid || 0)))

  const stageCounts = STATUSES.map(s => ({ status: s, count: brides.filter(b => b.status === s).length }))
  const attentionCount = overdue.length + noTimeline.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Dashboard</h1>
          <p className="text-[11px] text-gray-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={onRefresh} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
          ↻ Refresh
        </button>
      </div>

      {/* Priority list */}
      {attentionCount > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-red-800 mb-2.5 flex items-center gap-1.5">
            ⚠️ Needs attention — {attentionCount} item{attentionCount === 1 ? '' : 's'}
          </p>
          <div className="space-y-1.5">
            {overdue.map(m => {
              const b = brideById[m.bride_id]
              const late = daysBetween(m.due_date || today, today)
              return (
                <button key={m.id} onClick={() => onOpenBride(b)}
                  className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-red-100/60 text-left flex-wrap">
                  <Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} sm />
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{m.label}</span>
                  <span className="ml-auto text-red-700 font-medium whitespace-nowrap">
                    {late} day{late === 1 ? '' : 's'} overdue
                  </span>
                </button>
              )
            })}
            {noTimeline.map(b => (
              <button key={b.id} onClick={() => onOpenBride(b)}
                className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-red-100/60 text-left flex-wrap">
                <Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} sm />
                <span className="font-medium text-gray-800">{b.name}</span>
                <span className="text-gray-600">No timeline set up yet</span>
                <span className="ml-auto text-amber-700 font-medium whitespace-nowrap">Add milestones →</span>
              </button>
            ))}
          </div>
        </div>
      ) : brides.length > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
            ✓ Nothing overdue — every bride is on track
          </p>
        </div>
      ) : null}

      {/* Empty state */}
      {brides.length === 0 && prospects.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500 mb-1">Nothing here yet</p>
          <p className="text-xs text-gray-400 mb-4">Add your first bride to see the dashboard come alive</p>
          <button onClick={() => onGoto('brides')} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">Add a bride</button>
        </div>
      )}

      {/* Pipeline funnel */}
      <Panel title="Pipeline" icon="⇢">
        <div className="flex overflow-hidden rounded-lg">
          <div className="flex-1 bg-gray-100 p-2.5 text-center border-r border-white">
            <div className="text-sm">📱</div>
            <div className="text-lg font-semibold text-gray-700">{prospects.length}</div>
            <div className="text-[9px] text-gray-500">Prospects</div>
          </div>
          {stageCounts.map((s, i) => {
            const cfg = STATUS_STAGE[s.status] || { color: 'blue', icon: '•' }
            const c = COLORS[cfg.color]
            return (
              <div key={s.status} className={`flex-1 ${c.bg} p-2.5 text-center ${i < stageCounts.length - 1 ? 'border-r border-white' : ''}`}>
                <div className="text-sm">{cfg.icon}</div>
                <div className={`text-lg font-semibold ${c.text}`}>{s.count}</div>
                <div className={`text-[9px] ${c.text} leading-tight`}>{s.status.replace(' confirmed', '').replace(' stage', '').replace(' review', '')}</div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Calendar + right column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalendarPanel brides={brides} milestones={milestones} onOpenBride={onOpenBride} />

        <div className="space-y-4">
          <Panel title="Revenue" icon="📊">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Contracted', money(totals.total), ''],
                ['Collected', money(totals.paid), 'text-emerald-600'],
                ['Outstanding', money(totals.total - totals.paid), 'text-red-500'],
                ['Avg margin', avgMargin + '%', ''],
              ].map(([l, v, c], i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[9px] text-gray-400">{l}</p>
                  <p className={`text-base font-semibold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Outstanding payments" icon="💰" action={
            outstanding.length > 0 ? <span className="text-[10px] text-gray-400">{outstanding.length} bride{outstanding.length === 1 ? '' : 's'}</span> : undefined
          }>
            {outstanding.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">Everything is paid up</p>
            ) : (
              <div className="space-y-0.5">
                {outstanding.slice(0, 5).map(b => {
                  const owed = (b.total || 0) - (b.paid || 0)
                  const pct = b.total ? Math.round((b.paid / b.total) * 100) : 0
                  return (
                    <button key={b.id} onClick={() => onOpenBride(b)} className="w-full flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 text-left">
                      <Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} sm />
                      <span className="text-[11px] text-gray-700 flex-1 truncate">{b.name}</span>
                      <span className="text-[10px] text-gray-400">{pct}% paid</span>
                      <span className="text-[11px] font-medium text-red-500 w-16 text-right">{money(owed)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Upcoming + weddings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Coming up — next 30 days" icon="🗓" action={
          dueSoon.length > 0 ? <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">{dueSoon.length} this week</span> : undefined
        }>
          {upcoming.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No milestones scheduled</p>
          ) : (
            <div className="space-y-0.5">
              {upcoming.map(m => {
                const b = brideById[m.bride_id]
                const days = daysBetween(today, m.due_date || today)
                return (
                  <button key={m.id} onClick={() => onOpenBride(b)} className="w-full flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 text-left">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${days <= 7 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <span className="text-[11px] text-gray-700 flex-1 truncate">
                      <span className="font-medium">{b.name.split(' ')[0]}</span> · {m.label}
                    </span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                    <span className="text-[10px] text-gray-400 w-12 text-right">{shortDate(m.due_date)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Panel>

        <Panel title="Weddings ahead" icon="💍">
          {weddings.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No upcoming wedding dates</p>
          ) : (
            <div className="space-y-0.5">
              {weddings.map(b => {
                const days = daysBetween(today, b.wedding_date || today)
                const mine = milestones.filter(m => m.bride_id === b.id)
                const done = mine.filter(m => m.done).length
                return (
                  <button key={b.id} onClick={() => onOpenBride(b)} className="w-full flex items-center gap-2 py-2 px-1 rounded hover:bg-gray-50 text-left">
                    <Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} sm />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {prettyDate(b.wedding_date)}
                        {mine.length > 0 && ` · ${done}/${mine.length} milestones`}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${days <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {days === 0 ? 'Today!' : `${days} days`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function CalendarPanel({ brides, milestones, onOpenBride }: {
  brides: Bride[]
  milestones: Milestone[]
  onOpenBride: (b: Bride) => void
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [picked, setPicked] = useState<string | null>(null)

  const brideById = useMemo(() => {
    const map: Record<string, Bride> = {}
    brides.forEach(b => { map[b.id] = b })
    return map
  }, [brides])

  interface DayEvent { kind: 'wedding' | 'milestone'; label: string; bride: Bride; done?: boolean }

  const eventsByDay = useMemo(() => {
    const map: Record<string, DayEvent[]> = {}
    brides.forEach(b => {
      if (b.wedding_date) {
        if (!map[b.wedding_date]) map[b.wedding_date] = []
        map[b.wedding_date].push({ kind: 'wedding', label: 'Wedding day', bride: b })
      }
    })
    milestones.forEach(m => {
      const b = brideById[m.bride_id]
      if (!m.due_date || !b) return
      if (!map[m.due_date]) map[m.due_date] = []
      map[m.due_date].push({ kind: 'milestone', label: m.label, bride: b, done: m.done })
    })
    return map
  }, [brides, milestones, brideById])

  const first = new Date(year, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const tKey = todayKey()

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth()); setPicked(null)
  }

  const pickedEvents = picked ? eventsByDay[picked] || [] : []
  const monthHasEvents = Object.keys(eventsByDay).some(k => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))

  return (
    <Panel title={`${MONTHS[month]} ${year}`} icon="📅" action={
      <div className="flex items-center gap-1">
        <button onClick={() => shift(-1)} className="w-5 h-5 rounded border border-gray-200 text-gray-400 text-[10px] hover:bg-gray-50">‹</button>
        <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setPicked(null) }}
          className="px-2 h-5 rounded border border-gray-200 text-gray-400 text-[9px] hover:bg-gray-50">Today</button>
        <button onClick={() => shift(1)} className="w-5 h-5 rounded border border-gray-200 text-gray-400 text-[10px] hover:bg-gray-50">›</button>
      </div>
    }>
      <div className="grid grid-cols-7 gap-y-1 mb-2">
        {DOW.map(d => <div key={d} className="text-center text-[9px] text-gray-300 pb-1">{d}</div>)}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const key = ymd(year, month, day)
          const evs = eventsByDay[key] || []
          const isToday = key === tKey
          const isPicked = key === picked
          const hasWedding = evs.some(e => e.kind === 'wedding')
          const hasOverdue = evs.some(e => e.kind === 'milestone' && !e.done && key < tKey)
          return (
            <button key={day} onClick={() => setPicked(isPicked ? null : key)}
              className={`h-7 rounded-md text-[10px] relative flex flex-col items-center justify-center transition-colors
                ${isPicked ? 'bg-gray-900 text-white' : isToday ? 'bg-blue-50 text-blue-700 font-semibold' : evs.length ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-50'}`}>
              <span className="leading-none">{day}</span>
              {evs.length > 0 && (
                <span className="flex gap-0.5 mt-0.5">
                  {hasWedding && <span className={`w-1 h-1 rounded-full ${isPicked ? 'bg-white' : 'bg-pink-500'}`} />}
                  {evs.some(e => e.kind === 'milestone') && (
                    <span className={`w-1 h-1 rounded-full ${isPicked ? 'bg-white' : hasOverdue ? 'bg-red-500' : 'bg-amber-500'}`} />
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-gray-100 pt-2">
        {picked ? (
          pickedEvents.length === 0 ? (
            <p className="text-[10px] text-gray-400 py-2 text-center">Nothing on {prettyDate(picked)}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{prettyDate(picked)}</p>
              {pickedEvents.map((e, i) => (
                <button key={i} onClick={() => onOpenBride(e.bride)} className="w-full flex items-center gap-1.5 text-[10px] py-1 px-1 rounded hover:bg-gray-50 text-left">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.kind === 'wedding' ? 'bg-pink-500' : e.done ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="font-medium text-gray-700">{e.bride.name.split(' ')[0]}</span>
                  <span className="text-gray-500 truncate">{e.kind === 'wedding' ? '💍 Wedding day' : e.label}</span>
                  {e.done && <span className="text-emerald-600 ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 justify-center py-1">
            <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Wedding</span>
            <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Milestone</span>
            <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Overdue</span>
          </div>
        )}
        {!picked && !monthHasEvents && (
          <p className="text-[10px] text-gray-300 text-center pt-1">Nothing scheduled this month</p>
        )}
      </div>
    </Panel>
  )
}

function Books({ brides }: { brides: Bride[] }) {
  const totals = brides.reduce((a, b) => ({ total: a.total + (b.total || 0), paid: a.paid + (b.paid || 0) }), { total: 0, paid: 0 })
  const avgMargin = brides.length ? Math.round(brides.reduce((a, b) => a + (b.margin || 0), 0) / brides.length) : 0
  const estProfit = Math.round(brides.reduce((a, b) => a + ((b.total || 0) * (b.margin || 0) / 100), 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold">Books</h1>
        <span className="text-[10px] text-gray-400">🔒 Admin only</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          ['Total contracted', money(totals.total), ''],
          ['Collected', money(totals.paid), 'text-emerald-600'],
          ['Outstanding', money(totals.total - totals.paid), 'text-red-500'],
          ['Est. gross profit', money(estProfit), 'text-gray-800'],
        ].map(([l, v, c], i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">{l}</p><p className={`text-lg font-semibold ${c}`}>{v}</p></div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400 gap-2">
          <span className="col-span-2">Bride</span><span>Contract</span><span>Paid</span><span>Outstanding</span><span>Margin</span>
        </div>
        {brides.map(b => (
          <div key={b.id} className="grid grid-cols-6 items-center px-4 py-3 border-t border-gray-50 gap-2">
            <div className="col-span-2 flex items-center gap-2"><Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} sm /><span className="text-xs truncate">{b.name}</span></div>
            <span className="text-xs">{money(b.total)}</span>
            <span className="text-xs text-emerald-600">{money(b.paid)}</span>
            <span className="text-xs text-red-500">{money((b.total || 0) - (b.paid || 0))}</span>
            <span className="text-xs">{b.margin || 0}%</span>
          </div>
        ))}
        {brides.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">No financial data yet</div>}
        {brides.length > 0 && (
          <div className="grid grid-cols-6 items-center px-4 py-3 border-t border-gray-200 bg-gray-50 gap-2 font-medium">
            <span className="col-span-2 text-xs">Total</span>
            <span className="text-xs">{money(totals.total)}</span>
            <span className="text-xs text-emerald-600">{money(totals.paid)}</span>
            <span className="text-xs text-red-500">{money(totals.total - totals.paid)}</span>
            <span className="text-xs">{avgMargin}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DesignerPortal({ brides, milestones, profile, isDesigner, selectedBride, setSelectedBride, onSaved }: {
  brides: Bride[]
  milestones: Milestone[]
  profile: Profile
  isDesigner: boolean
  selectedBride: Bride | null
  setSelectedBride: (b: Bride | null) => void
  onSaved: () => void
}) {
  const today = todayKey()
  const overdue = milestones.filter(m => !m.done && m.due_date && m.due_date < today)
  const dueSoon = milestones.filter(m => !m.done && m.due_date && m.due_date >= today && m.due_date <= addDaysKey(7))
  const brideById: Record<string, Bride> = {}
  brides.forEach(b => { brideById[b.id] = b })

  if (selectedBride) {
    return <BrideDetail bride={selectedBride} onBack={() => setSelectedBride(null)} onSaved={onSaved} canSeeMoney={false} />
  }

  return (
    <div>
      <h1 className="text-base font-semibold mb-1">
        {isDesigner ? `Hello, ${(profile.full_name || 'there').split(' ')[0]}` : 'Designer view'}
      </h1>
      <p className="text-[11px] text-gray-400 mb-4">Designer portal · your brides and what needs doing</p>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4">
          <p className="text-xs font-semibold text-red-800 mb-2">⚠️ {overdue.length} overdue</p>
          <div className="space-y-1">
            {overdue.map(m => {
              const b = brideById[m.bride_id]
              if (!b) return null
              const late = daysBetween(m.due_date || today, today)
              return (
                <button key={m.id} onClick={() => setSelectedBride(b)} className="w-full flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-red-100/60 text-left">
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{m.label}</span>
                  <span className="ml-auto text-red-700">{late}d late</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">🔔 Due this week</p>
          <div className="space-y-1">
            {dueSoon.map(m => {
              const b = brideById[m.bride_id]
              if (!b) return null
              return (
                <button key={m.id} onClick={() => setSelectedBride(b)} className="w-full flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-amber-100/60 text-left">
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{m.label}</span>
                  <span className="ml-auto text-amber-700">{shortDate(m.due_date)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">My brides</p>
      {brides.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">No brides assigned yet</div>
      ) : brides.map(b => {
        const mine = milestones.filter(m => m.bride_id === b.id)
        const done = mine.filter(m => m.done).length
        const next = mine.find(m => !m.done)
        return (
          <button key={b.id} onClick={() => setSelectedBride(b)} className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar initials={b.initials || initialsOf(b.name)} color={b.status_color} />
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-[10px] text-gray-400">Wedding {prettyDate(b.wedding_date)}</p>
                </div>
              </div>
              <Badge label={b.status} color={b.status_color} />
            </div>
            {next && (
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Next up</p>
                <p className="text-xs text-gray-800 font-medium">{next.label} <span className="font-normal text-gray-400">· {prettyDate(next.due_date)}</span></p>
              </div>
            )}
            {mine.length > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(done / mine.length) * 100}%` }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">{done} of {mine.length} milestones complete</p>
              </div>
            )}
            {b.brief && <p className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2 line-clamp-2">{b.brief}</p>}
            {b.gatekeeper && <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-2">🔒 Gatekeeper: {b.gatekeeper}</p>}
          </button>
        )
      })}
    </div>
  )
}

function BridePortal({ brides, milestones, isRealBride, profile, previewBrideId, setPreviewBrideId }: {
  brides: Bride[]
  milestones: Milestone[]
  isRealBride: boolean
  profile: Profile
  previewBrideId: string
  setPreviewBrideId: (id: string) => void
}) {
  const b = isRealBride
    ? brides.find(x => x.id === profile.bride_id) || null
    : brides.find(x => x.id === previewBrideId) || brides[0] || null

  if (!b) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
        <p className="text-sm text-gray-500">No bride record linked to this account</p>
        <p className="text-xs text-gray-400 mt-1">A Roéma admin needs to link your login to your gown record</p>
      </div>
    )
  }

  const mine = milestones.filter(m => m.bride_id === b.id)
  const pct = b.total ? Math.round((b.paid / b.total) * 100) : 0
  const doneCount = mine.filter(m => m.done).length
  const nextUp = mine.find(m => !m.done)
  const daysToWedding = b.wedding_date ? daysBetween(todayKey(), b.wedding_date) : null

  return (
    <div>
      {!isRealBride && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-blue-800 font-medium">Preview mode</span>
          <span className="text-[11px] text-blue-700">Showing what a bride sees:</span>
          <select className="text-xs px-2 py-1 rounded-lg border border-blue-200 bg-white ml-auto"
            value={previewBrideId || b.id} onChange={e => setPreviewBrideId(e.target.value)}>
            {brides.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
      )}

      <div className="border-b border-gray-100 pb-3 mb-4 flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base font-semibold">Hello, {b.name.split(' ')[0]} 👋</h1>
          <p className="text-[11px] text-gray-400">Roéma Atelier · Wedding {prettyDate(b.wedding_date)}</p>
        </div>
        {daysToWedding !== null && daysToWedding >= 0 && (
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-800 leading-none">{daysToWedding}</p>
            <p className="text-[10px] text-gray-400">days to go</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-gray-900">Current stage: {b.status}</p>
        </div>
        {nextUp && (
          <p className="text-[11px] text-gray-600 mt-1 ml-[18px]">
            Next up: {nextUp.label}{nextUp.due_date ? ` · ${prettyDate(nextUp.due_date)}` : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <InfoCard label="Your designer" value={b.designer} />
        <InfoCard label="Location" value={b.location} />
        <InfoCard label="Wedding date" value={prettyDate(b.wedding_date)} />
      </div>

      {b.brief && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Your design brief</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{b.brief}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Your gown journey</p>
          {mine.length > 0 && <span className="text-[10px] text-gray-400">{doneCount} of {mine.length} complete</span>}
        </div>
        {mine.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Your timeline will appear here once Roéma sets it up</p>
        ) : (
          <>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(doneCount / mine.length) * 100}%` }} />
            </div>
            <div className="space-y-0">
              {mine.map((m, i) => {
                const isNext = !m.done && mine.findIndex(x => !x.done) === i
                return (
                  <div key={m.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 ${
                        m.done ? 'bg-emerald-500 border-emerald-500' : isNext ? 'bg-white border-amber-400' : 'bg-white border-gray-200'
                      }`} />
                      {i < mine.length - 1 && <div className={`w-px flex-1 min-h-[28px] ${m.done ? 'bg-emerald-200' : 'bg-gray-100'}`} />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`text-sm ${m.done ? 'text-gray-400 line-through' : isNext ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{m.label}</p>
                      <p className="text-[10px] text-gray-400">
                        {prettyDate(m.due_date)}
                        {m.done && <span className="text-emerald-600 ml-2">✓ Complete</span>}
                        {isNext && <span className="text-amber-600 ml-2">← You are here</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Payments</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Total</p><p className="text-base font-semibold">{money(b.total)}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Paid</p><p className="text-base font-semibold text-emerald-600">{money(b.paid)}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Outstanding</p><p className="text-base font-semibold text-red-500">{money(b.total - b.paid)}</p></div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 text-right mt-1">{pct}% paid</p>
      </div>
    </div>
  )
}

function TeamTab({ brides, currentUserId }: { brides: Bride[]; currentUserId: string }) {
  const [people, setPeople] = useState<TeamProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setPeople((data as TeamProfile[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function setRole(id: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    setMsg(error ? error.message : 'Updated ✓')
    setTimeout(() => setMsg(''), 2000)
    load()
  }

  async function setBrideLink(id: string, brideId: string) {
    const { error } = await supabase.from('profiles').update({ bride_id: brideId || null }).eq('id', id)
    setMsg(error ? error.message : 'Updated ✓')
    setTimeout(() => setMsg(''), 2000)
    load()
  }

  const select = 'text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Team &amp; settings</h1>
        {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400">
          Members — {people.length} account{people.length === 1 ? '' : 's'}
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Loading…</div>
        ) : people.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-400">No accounts yet</div>
        ) : people.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 flex-wrap">
            <Avatar initials={initialsOf(p.full_name || p.email)} color={ROLE_COLORS[p.role] || 'blue'} />
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs font-medium">
                {p.full_name || '—'}
                {p.id === currentUserId && <span className="text-[9px] text-gray-400 font-normal"> (you)</span>}
              </p>
              <p className="text-[10px] text-gray-400">{p.email}</p>
            </div>
            {p.role === 'bride' && (
              <select className={select} value={p.bride_id || ''} onChange={e => setBrideLink(p.id, e.target.value)}>
                <option value="">Link to bride…</option>
                {brides.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <select className={select} value={p.role} onChange={e => setRole(p.id, e.target.value)} disabled={p.id === currentUserId}>
              <option value="roema_admin">Roéma admin</option>
              <option value="designer">Designer</option>
              <option value="bride">Bride</option>
            </select>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium mb-2">Adding someone new</p>
        <ol className="text-[11px] text-gray-500 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Send them the site URL and ask them to click &ldquo;Create account&rdquo;</li>
          <li>They will see a &ldquo;pending setup&rdquo; screen until you assign a role</li>
          <li>Refresh this page — their account appears above</li>
          <li>Pick their role. Brides also need linking to their gown record.</li>
        </ol>
        <p className="text-[10px] text-gray-400 mt-3">
          <strong>Roéma admin</strong> sees everything · <strong>Designer</strong> sees briefs, timeline and internal notes but no financials · <strong>Bride</strong> sees only her own record
        </p>
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
    const { error } = await supabase.from('brides').insert({
      name: f.name.trim(), initials: initialsOf(f.name), location: f.location || null,
      wedding_date: f.wedding_date || null, designer: f.designer || null,
      total: Number(f.total) || 0, paid: Number(f.paid) || 0, margin: Number(f.margin) || 0,
      status: f.status, status_color: f.status_color,
      brief: f.brief || null, kyc: f.kyc || null, gatekeeper: f.gatekeeper || null,
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
        <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input type="date" className={input} value={f.wedding_date} onChange={e => setF({ ...f, wedding_date: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Designer</label><input className={input} value={f.designer} onChange={e => setF({ ...f, designer: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Status</label>
          <select className={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Status colour</label>
          <select className={input} value={f.status_color} onChange={e => setF({ ...f, status_color: e.target.value })}>
            <option value="blue">Blue</option><option value="amber">Amber</option><option value="teal">Teal</option><option value="coral">Coral</option><option value="green">Green</option>
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Contract total</label><input type="number" className={input} value={f.total} onChange={e => setF({ ...f, total: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Amount paid</label><input type="number" className={input} value={f.paid} onChange={e => setF({ ...f, paid: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Margin %</label><input type="number" className={input} value={f.margin} onChange={e => setF({ ...f, margin: e.target.value })} /></div>
      </div>
      <div className="space-y-3 mb-3">
        <div><label className="text-[10px] text-gray-400 block mb-1">Design brief</label><textarea rows={2} className={input + ' resize-none'} value={f.brief} onChange={e => setF({ ...f, brief: e.target.value })} placeholder="Silhouette, fabric, colourway…" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">KYC / internal notes 🔒</label><textarea rows={2} className={input + ' resize-none'} value={f.kyc} onChange={e => setF({ ...f, kyc: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Gatekeeper 🔒</label><input className={input} value={f.gatekeeper} onChange={e => setF({ ...f, gatekeeper: e.target.value })} /></div>
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
        <div><label className="text-[10px] text-gray-400 block mb-1">Phone / WhatsApp</label><input className={input} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input className={input} value={f.wedding_date} onChange={e => setF({ ...f, wedding_date: e.target.value })} placeholder="Mar 2027" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Budget</label><input className={input} value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })} /></div>
      </div>
      <div className="mb-3"><label className="text-[10px] text-gray-400 block mb-1">Original message</label><textarea rows={2} className={input + ' resize-none'} value={f.raw_message} onChange={e => setF({ ...f, raw_message: e.target.value })} /></div>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save prospect'}</button>
        <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )
}

const PRESET_TIMELINE = [
  'Kickoff brief',
  'Mood board approval',
  'Design concept',
  'Design sign-off',
  'Fabric sourcing',
  'First toile fitting',
  'Second fitting',
  'Final fitting',
  'Gown delivery',
]

function TimelineEditor({ brideId }: { brideId: string }) {
  const [items, setItems] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('timeline_steps').select('*').eq('bride_id', brideId)
      .order('sort_order', { ascending: true })
    setItems((data as Milestone[]) || [])
    setLoading(false)
  }, [brideId])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!label.trim()) { setErr('Give the milestone a name'); return }
    setBusy(true); setErr('')
    const nextOrder = items.length ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 0
    const { error } = await supabase.from('timeline_steps').insert({
      bride_id: brideId, label: label.trim(), due_date: due || null, done: false, sort_order: nextOrder,
    })
    setBusy(false)
    if (error) { setErr(error.message); return }
    setLabel(''); setDue(''); load()
  }

  async function addPreset() {
    setBusy(true); setErr('')
    const rows = PRESET_TIMELINE.map((l, i) => ({
      bride_id: brideId, label: l, due_date: null, done: false, sort_order: i,
    }))
    const { error } = await supabase.from('timeline_steps').insert(rows)
    setBusy(false)
    if (error) { setErr(error.message); return }
    load()
  }

  async function toggle(m: Milestone) {
    await supabase.from('timeline_steps').update({ done: !m.done }).eq('id', m.id)
    load()
  }

  async function setDate(m: Milestone, d: string) {
    await supabase.from('timeline_steps').update({ due_date: d || null }).eq('id', m.id)
    load()
  }

  async function remove(id: string) {
    await supabase.from('timeline_steps').delete().eq('id', id)
    load()
  }

  async function move(m: Milestone, dir: -1 | 1) {
    const idx = items.findIndex(i => i.id === m.id)
    const swapWith = items[idx + dir]
    if (!swapWith) return
    await supabase.from('timeline_steps').update({ sort_order: swapWith.sort_order }).eq('id', m.id)
    await supabase.from('timeline_steps').update({ sort_order: m.sort_order }).eq('id', swapWith.id)
    load()
  }

  const input = 'text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'
  const doneCount = items.filter(i => i.done).length
  const today = todayKey()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Milestones shown to the bride in her portal</p>
        {items.length > 0 && <span className="text-[10px] text-gray-400">{doneCount}/{items.length} complete</span>}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-6 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center mb-4">
          <p className="text-xs text-gray-500 mb-3">No milestones yet</p>
          <button onClick={addPreset} disabled={busy}
            className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
            {busy ? 'Adding…' : 'Use standard 9-step timeline'}
          </button>
          <p className="text-[10px] text-gray-400 mt-2">You can edit, reorder and date them after</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          {items.map((m, i) => {
            const isLate = !m.done && m.due_date && m.due_date < today
            return (
              <div key={m.id} className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${isLate ? 'bg-red-50/40' : ''}`}>
                <button onClick={() => toggle(m)} title={m.done ? 'Mark as not done' : 'Mark as complete'}
                  className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${m.done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300 hover:border-emerald-400'}`}>
                  {m.done && <span className="text-white text-[9px] leading-none">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${m.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {m.label}
                    {isLate && <span className="text-[9px] text-red-600 ml-2">overdue</span>}
                  </p>
                </div>
                <input type="date" value={m.due_date || ''} onChange={e => setDate(m, e.target.value)}
                  className="text-[10px] px-1.5 py-1 rounded border border-gray-200 text-gray-500 w-[110px]" />
                <div className="flex items-center gap-1">
                  <button onClick={() => move(m, -1)} disabled={i === 0}
                    className="text-[10px] w-5 h-5 rounded border border-gray-200 text-gray-400 hover:bg-white disabled:opacity-30">↑</button>
                  <button onClick={() => move(m, 1)} disabled={i === items.length - 1}
                    className="text-[10px] w-5 h-5 rounded border border-gray-200 text-gray-400 hover:bg-white disabled:opacity-30">↓</button>
                  <button onClick={() => remove(m.id)}
                    className="text-[10px] px-2 h-5 rounded border border-red-100 text-red-500 hover:bg-red-50">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Add milestone</p>
        <div className="flex gap-2 flex-wrap">
          <input className={input + ' flex-1 min-w-[180px]'} value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. First toile fitting" />
          <input type="date" className={input} value={due} onChange={e => setDue(e.target.value)} />
          <button onClick={add} disabled={busy} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
        <p className="text-[10px] text-gray-400 mt-2">
          Dated milestones appear on the dashboard calendar and trigger the overdue alerts.
        </p>
      </div>
    </div>
  )
}

function BrideDetail({ bride, onBack, onSaved, canDelete, canSeeMoney }: {
  bride: Bride; onBack: () => void; onSaved: () => void; canDelete?: boolean; canSeeMoney?: boolean
}) {
  const [tab, setTab] = useState('brief')
  const [f, setF] = useState(bride)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const tabs = canSeeMoney
    ? [['brief', 'Brief'], ['timeline', 'Timeline'], ['payments', 'Payments'], ['notes', 'Internal notes']]
    : [['brief', 'Brief'], ['timeline', 'Timeline'], ['notes', 'Internal notes']]

  async function save() {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: f.name, initials: initialsOf(f.name), location: f.location,
      wedding_date: f.wedding_date || null, designer: f.designer,
      status: f.status, status_color: f.status_color,
      brief: f.brief, kyc: f.kyc, gatekeeper: f.gatekeeper,
    }
    if (canSeeMoney) {
      payload.total = Number(f.total) || 0
      payload.paid = Number(f.paid) || 0
      payload.margin = Number(f.margin) || 0
    }
    const { error } = await supabase.from('brides').update(payload).eq('id', bride.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved ✓')
    setTimeout(() => setMsg(''), 2000)
    if (!error) onSaved()
  }

  async function remove() {
    if (!confirm('Delete this bride and her timeline? This cannot be undone.')) return
    await supabase.from('brides').delete().eq('id', bride.id)
    onSaved(); onBack()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{bride.name}</span>
        <Badge label={f.status} color={f.status_color} />
        <span className="ml-auto flex items-center gap-2">
          {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
          <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </span>
      </div>

      <div className="flex gap-1.5 mb-4 pb-3 border-b border-gray-100 flex-wrap">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1 text-xs rounded-lg border ${tab === id ? 'bg-gray-100 font-medium border-gray-200' : 'text-gray-400 border-gray-100 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'brief' && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] text-gray-400 block mb-1">Name</label><input className={input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location || ''} onChange={e => setF({ ...f, location: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input type="date" className={input} value={f.wedding_date || ''} onChange={e => setF({ ...f, wedding_date: e.target.value })} /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Designer</label><input className={input} value={f.designer || ''} onChange={e => setF({ ...f, designer: e.target.value })} placeholder="Who is making this gown" /></div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Status</label>
            <select className={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="text-[10px] text-gray-400 block mb-1">Status colour</label>
            <select className={input} value={f.status_color} onChange={e => setF({ ...f, status_color: e.target.value })}>
              <option value="blue">Blue</option><option value="amber">Amber</option><option value="teal">Teal</option><option value="coral">Coral</option><option value="green">Green</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 block mb-1">Design brief — visible to the bride</label>
            <textarea rows={5} className={input + ' resize-none'} value={f.brief || ''} onChange={e => setF({ ...f, brief: e.target.value })}
              placeholder="Silhouette, fabric, colourway, any agreed details…" />
          </div>
        </div>
      )}

      {tab === 'timeline' && <TimelineEditor brideId={bride.id} />}

      {tab === 'payments' && canSeeMoney && (
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
          <p className="text-xs text-gray-400 mb-3">🔒 Visible to Roéma and the designer only — never shown to the bride</p>
          <div className="mb-3"><label className="text-[10px] text-gray-400 block mb-1">KYC profile</label><textarea rows={4} className={input + ' resize-none'} value={f.kyc || ''} onChange={e => setF({ ...f, kyc: e.target.value })} placeholder="Preferences, sensitivities, how she likes to communicate…" /></div>
          <div className="mb-4"><label className="text-[10px] text-gray-400 block mb-1">Gatekeeper</label><input className={input} value={f.gatekeeper || ''} onChange={e => setF({ ...f, gatekeeper: e.target.value })} placeholder="Who signs off decisions" /></div>
          {canDelete && <button onClick={remove} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete bride</button>}
        </div>
      )}
    </div>
  )
}
