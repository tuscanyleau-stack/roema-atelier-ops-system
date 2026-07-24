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
  wedding_date: string | null
  kyc: string
  gatekeeper: string
  currency: string | null
}

interface Project {
  id: string
  bride_id: string
  name: string
  designer: string
  designer_id: string | null
  status: string
  status_color: string
  brief: string
  total: number
  paid: number
  margin: number
  service: string | null
  engagement_type: string | null
  sort_order: number
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

interface DesignerAccount {
  id: string
  full_name: string | null
  email: string
}

interface Milestone {
  id: string
  bride_id: string
  project_id: string | null
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
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-500' },
}

const AVATARS: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800',
  teal: 'bg-teal-100 text-teal-800',
  blue: 'bg-blue-100 text-blue-800',
  coral: 'bg-orange-100 text-orange-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
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

const STATUSES = ['Brief confirmed', 'In progress', 'Design review', 'Production', 'Fitting stage', 'Delivered']

const STATUS_STAGE: Record<string, { color: string; icon: string }> = {
  'Brief confirmed': { color: 'blue', icon: '📋' },
  'In progress': { color: 'purple', icon: '⏳' },
  'Design review': { color: 'amber', icon: '✎' },
  'Production': { color: 'teal', icon: '🧵' },
  'Fitting stage': { color: 'coral', icon: '👗' },
  'Delivered': { color: 'green', icon: '📦' },
}

// "In progress" is reserved for RCL (roéma Complete Lead) workstreams
function isRCL(service?: string | null): boolean {
  return !!service && service.toUpperCase().startsWith('RCL')
}

function statusOptionsFor(service?: string | null, current?: string): string[] {
  const base = isRCL(service) ? STATUSES : STATUSES.filter(s => s !== 'In progress')
  return current && !base.includes(current) ? [current, ...base] : base
}

const SERVICES = [
  'Baseline (complimentary)',
  'Discovery Path',
  'Couture Brief & Planning Deck',
  'RCL — roéma Complete Lead',
  'Whiteglove — Overseas Couture Trip',
  'Whiteglove — Founder Presence',
  'Whiteglove — Wedding Day Styling',
]

const ENGAGEMENTS = ['Bespoke', 'Rental']

const CURRENCIES = ['MYR', 'SGD', 'AUD', 'USD']
const CURRENCY_SYMBOLS: Record<string, string> = { MYR: 'RM', SGD: 'S$', AUD: 'A$', USD: 'US$' }

const WORKSTREAM_PRESETS = [
  'Main gown', 'Prewedding', 'Welcome event', 'Wedding robe', 'Second march-in gown',
  'Tea ceremony', 'GDL', 'After-party look', 'Farewell event',
  'Cheongsam', 'Reception dress', 'Bridesmaids', 'Mother of the bride', 'Veil & accessories',
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const money = (n: number, currency?: string | null) => {
  const code = currency || 'MYR'
  return (CURRENCY_SYMBOLS[code] || code + ' ') + (n || 0).toLocaleString()
}

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
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 transition-colors hover:border-gray-300">
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

function WorkstreamNameField({ value, onChange, className }: {
  value: string
  onChange: (v: string) => void
  className: string
}) {
  const [custom, setCustom] = useState(false)
  const isPreset = WORKSTREAM_PRESETS.includes(value)
  const showCustom = custom || (value !== '' && !isPreset)
  return (
    <div>
      <select className={className} value={showCustom ? '__custom__' : value}
        onChange={e => {
          if (e.target.value === '__custom__') { setCustom(true) }
          else { setCustom(false); onChange(e.target.value) }
        }}>
        {value === '' && !showCustom && <option value="">Choose…</option>}
        {WORKSTREAM_PRESETS.map(w => <option key={w} value={w}>{w}</option>)}
        <option value="__custom__">Custom…</option>
      </select>
      {showCustom && (
        <input className={className + ' mt-1.5'} value={value} onChange={e => onChange(e.target.value)}
          placeholder="Type the workstream name" />
      )}
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
  const [projects, setProjects] = useState<Project[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [designers, setDesigners] = useState<DesignerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrideId, setSelectedBrideId] = useState<string | null>(null)
  const [previewBrideId, setPreviewBrideId] = useState<string>('')
  const [showAddBride, setShowAddBride] = useState(false)
  const [showAddProspect, setShowAddProspect] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: b } = await supabase.from('brides').select('*').order('created_at', { ascending: false })
    setBrides((b as Bride[]) || [])
    const { data: pr } = await supabase.from('projects').select('*').order('sort_order', { ascending: true })
    setProjects((pr as Project[]) || [])
    const { data: m } = await supabase.from('timeline_steps').select('*').order('sort_order', { ascending: true })
    setMilestones((m as Milestone[]) || [])
    if (isAdmin) {
      const { data: p } = await supabase.from('prospects').select('*').order('created_at', { ascending: false })
      setProspects((p as Prospect[]) || [])
      const { data: d } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'designer')
      setDesigners((d as DesignerAccount[]) || [])
    }
    setLoading(false)
  }, [isAdmin])

  useEffect(() => { loadData() }, [loadData])

  const selectedBride = brides.find(b => b.id === selectedBrideId) || null

  const navItems: [RoemaNav, string, string][] = [
    ['dashboard', '▦', 'Dashboard'],
    ['prospects', '📱', 'Prospects'],
    ['brides', '♡', 'Brides'],
    ['books', '📖', 'Books'],
    ['team', '👥', 'Team'],
  ]

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--paper)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {isAdmin ? (
            <>
              <span className="text-xs text-gray-400">View as:</span>
              {(['roema', 'designer', 'bride'] as ViewType[]).map(p => (
                <button key={p} onClick={() => { setView(p); setNav('dashboard'); setSelectedBrideId(null) }}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${view === p ? 'bg-gray-100 font-medium border-gray-300 text-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
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
                  <button key={id} onClick={() => { setNav(id); setSelectedBrideId(null) }}
                    className={`row-mark w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left ${nav === id ? 'bg-white text-gray-900 font-medium border-r-2 border-amber-500' : 'text-gray-500 hover:bg-gray-100'}`}>
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
                    brides={brides} projects={projects} prospects={prospects} milestones={milestones}
                    onOpenBride={id => { setNav('brides'); setSelectedBrideId(id) }}
                    onGoto={setNav} onRefresh={loadData}
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
                  <BridesList
                    brides={brides} projects={projects} milestones={milestones} designers={designers}
                    onSelect={setSelectedBrideId}
                    showAdd={showAddBride} setShowAdd={setShowAddBride} onSaved={loadData}
                  />
                )}

                {nav === 'brides' && selectedBride && (
                  <BrideDetail
                    bride={selectedBride}
                    projects={projects.filter(p => p.bride_id === selectedBride.id)}
                    milestones={milestones}
                    designers={designers}
                    onBack={() => setSelectedBrideId(null)} onSaved={loadData}
                    canDelete canSeeMoney canEditClient
                  />
                )}

                {nav === 'books' && <Books brides={brides} projects={projects} />}

                {nav === 'team' && <TeamTab brides={brides} currentUserId={profile.id} />}
              </>
            ) : view === 'designer' ? (
              <DesignerPortal
                brides={brides} projects={projects} milestones={milestones}
                profile={profile} isDesigner={isDesigner}
                selectedBrideId={selectedBrideId} setSelectedBrideId={setSelectedBrideId}
                onSaved={loadData}
              />
            ) : (
              <BridePortal
                brides={brides} projects={projects} milestones={milestones}
                isRealBride={isBride} profile={profile}
                previewBrideId={previewBrideId} setPreviewBrideId={setPreviewBrideId}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function brideTotals(projects: Project[]) {
  return projects.reduce((a, p) => ({ total: a.total + (p.total || 0), paid: a.paid + (p.paid || 0) }), { total: 0, paid: 0 })
}

function BridesList({ brides, projects, milestones, designers, onSelect, showAdd, setShowAdd, onSaved }: {
  brides: Bride[]
  projects: Project[]
  milestones: Milestone[]
  designers: DesignerAccount[]
  onSelect: (id: string) => void
  showAdd: boolean
  setShowAdd: (v: boolean) => void
  onSaved: () => void
}) {
  const today = todayKey()
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold">Brides</h1>
          <p className="text-[11px] text-gray-400">One client, however many workstreams</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800">+ Add bride</button>
      </div>
      {showAdd && <AddBrideForm designers={designers} onDone={() => { setShowAdd(false); onSaved() }} onCancel={() => setShowAdd(false)} />}
      {brides.length === 0 && !showAdd && (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">No brides yet</p>
        </div>
      )}
      <div className="space-y-2.5">
        {brides.map(b => {
          const mine = projects.filter(p => p.bride_id === b.id)
          const t = brideTotals(mine)
          const pct = t.total ? Math.round((t.paid / t.total) * 100) : 0
          const overdue = milestones.filter(m => !m.done && m.due_date && m.due_date < today && m.bride_id === b.id).length
          return (
            <button key={b.id} onClick={() => onSelect(b.id)}
              className="lift w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 text-left">
              <div className="flex items-start gap-3">
                <Avatar initials={b.initials || initialsOf(b.name)} color={mine[0]?.status_color || 'blue'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                    {overdue > 0 && <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">{overdue} overdue</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">
                    {b.location || 'No location'} · Wedding {prettyDate(b.wedding_date)}
                  </p>
                  {mine.length === 0 ? (
                    <p className="text-[11px] text-amber-600">No workstreams yet — click to add one</p>
                  ) : (
                    <div className="space-y-1">
                      {mine.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2 text-[11px]">
                          <span className="text-gray-300 w-3">{i + 1}.</span>
                          <span className="font-medium text-gray-700">{p.name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{p.designer || 'No designer set'}</span>
                          <span className="ml-auto"><Badge label={p.status} color={p.status_color} /></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">{mine.length} workstream{mine.length === 1 ? '' : 's'}</p>
                  {t.total > 0 && (
                    <>
                      <p className="text-xs font-medium text-gray-800 mt-1">{money(t.total, b.currency)}</p>
                      <p className="text-[10px] text-gray-400">{pct}% paid</p>
                    </>
                  )}
                </div>
                <span className="text-gray-300 self-center">›</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Dashboard({ brides, projects, prospects, milestones, onOpenBride, onGoto, onRefresh }: {
  brides: Bride[]
  projects: Project[]
  prospects: Prospect[]
  milestones: Milestone[]
  onOpenBride: (id: string) => void
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

  const projectById = useMemo(() => {
    const map: Record<string, Project> = {}
    projects.forEach(p => { map[p.id] = p })
    return map
  }, [projects])

  const revenueByCurrency = useMemo(() => {
    const map: Record<string, { total: number; paid: number }> = {}
    projects.forEach(p => {
      const cur = brideById[p.bride_id]?.currency || 'MYR'
      if (!map[cur]) map[cur] = { total: 0, paid: 0 }
      map[cur].total += p.total || 0
      map[cur].paid += p.paid || 0
    })
    return map
  }, [projects, brideById])
  const currencyKeys = Object.keys(revenueByCurrency).length ? Object.keys(revenueByCurrency).sort() : ['MYR']
  const avgMargin = projects.length ? Math.round(projects.reduce((a, p) => a + (p.margin || 0), 0) / projects.length) : 0

  const label = (m: Milestone) => {
    const proj = m.project_id ? projectById[m.project_id] : null
    return proj ? `${proj.name} · ${m.label}` : m.label
  }

  const overdue = milestones
    .filter(m => !m.done && m.due_date && m.due_date < today && brideById[m.bride_id])
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

  const dueSoon = milestones.filter(m => !m.done && m.due_date && m.due_date >= today && m.due_date <= in7 && brideById[m.bride_id])

  const upcoming = milestones
    .filter(m => !m.done && m.due_date && m.due_date >= today && m.due_date <= in30 && brideById[m.bride_id])
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 8)

  const noWorkstream = brides.filter(b => !projects.some(p => p.bride_id === b.id))
  const noTimeline = projects.filter(p => !milestones.some(m => m.project_id === p.id))

  const weddings = brides
    .filter(b => b.wedding_date && b.wedding_date >= today)
    .sort((a, b) => (a.wedding_date || '').localeCompare(b.wedding_date || ''))
    .slice(0, 5)

  const outstanding = brides
    .map(b => ({ bride: b, t: brideTotals(projects.filter(p => p.bride_id === b.id)) }))
    .filter(x => x.t.total - x.t.paid > 0)
    .sort((a, b) => (b.t.total - b.t.paid) - (a.t.total - a.t.paid))

  const stageCounts = STATUSES.map(s => ({ status: s, count: projects.filter(p => p.status === s).length }))
  const attentionCount = overdue.length + noWorkstream.length + noTimeline.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Dashboard</h1>
          <p className="text-[11px] text-gray-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{brides.length} bride{brides.length === 1 ? '' : 's'}, {projects.length} workstream{projects.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={onRefresh} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">↻ Refresh</button>
      </div>

      {attentionCount > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-red-800 mb-2.5">⚠️ Needs attention — {attentionCount} item{attentionCount === 1 ? '' : 's'}</p>
          <div className="space-y-1.5">
            {overdue.map(m => {
              const b = brideById[m.bride_id]
              const late = daysBetween(m.due_date || today, today)
              return (
                <button key={m.id} onClick={() => onOpenBride(b.id)}
                  className="row-mark w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-red-100/60 text-left flex-wrap">
                  <Avatar initials={b.initials || initialsOf(b.name)} color="red" sm />
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{label(m)}</span>
                  <span className="ml-auto text-red-700 font-medium whitespace-nowrap">{late} day{late === 1 ? '' : 's'} overdue</span>
                </button>
              )
            })}
            {noWorkstream.map(b => (
              <button key={b.id} onClick={() => onOpenBride(b.id)}
                className="row-mark w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-red-100/60 text-left flex-wrap">
                <Avatar initials={b.initials || initialsOf(b.name)} color="amber" sm />
                <span className="font-medium text-gray-800">{b.name}</span>
                <span className="text-gray-600">No workstream set up</span>
                <span className="ml-auto text-amber-700 font-medium">Add one →</span>
              </button>
            ))}
            {noTimeline.map(p => {
              const b = brideById[p.bride_id]
              if (!b) return null
              return (
                <button key={p.id} onClick={() => onOpenBride(b.id)}
                  className="row-mark w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-red-100/60 text-left flex-wrap">
                  <Avatar initials={b.initials || initialsOf(b.name)} color="amber" sm />
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{p.name} — no timeline yet</span>
                  <span className="ml-auto text-amber-700 font-medium">Add milestones →</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : brides.length > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
          <p className="text-xs font-medium text-emerald-800">✓ Nothing overdue — every workstream is on track</p>
        </div>
      ) : null}

      {brides.length === 0 && prospects.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500 mb-1">Nothing here yet</p>
          <p className="text-xs text-gray-400 mb-4">Add your first bride to see the dashboard come alive</p>
          <button onClick={() => onGoto('brides')} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">Add a bride</button>
        </div>
      )}

      <Panel title="Pipeline — by workstream" icon="⇢">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalendarPanel brides={brides} projects={projects} milestones={milestones} onOpenBride={onOpenBride} />

        <div className="space-y-4">
          <Panel title="Revenue" icon="📊">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Contracted', cls: '', lines: currencyKeys.map(c => money(revenueByCurrency[c]?.total || 0, c)) },
                { label: 'Collected', cls: 'text-emerald-600', lines: currencyKeys.map(c => money(revenueByCurrency[c]?.paid || 0, c)) },
                { label: 'Outstanding', cls: 'text-red-500', lines: currencyKeys.map(c => money((revenueByCurrency[c]?.total || 0) - (revenueByCurrency[c]?.paid || 0), c)) },
                { label: 'Avg margin', cls: '', lines: [avgMargin + '%'] },
              ].map(cell => (
                <div key={cell.label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[9px] text-gray-400">{cell.label}</p>
                  {cell.lines.map((v, i) => (
                    <p key={i} className={`${currencyKeys.length > 1 ? 'text-sm' : 'text-base'} font-semibold ${cell.cls}`}>{v}</p>
                  ))}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Outstanding payments" icon="💰">
            {outstanding.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">Everything is paid up</p>
            ) : (
              <div className="space-y-0.5">
                {outstanding.slice(0, 5).map(({ bride: b, t }) => {
                  const pct = t.total ? Math.round((t.paid / t.total) * 100) : 0
                  return (
                    <button key={b.id} onClick={() => onOpenBride(b.id)} className="w-full flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 text-left">
                      <Avatar initials={b.initials || initialsOf(b.name)} color="blue" sm />
                      <span className="text-[11px] text-gray-700 flex-1 truncate">{b.name}</span>
                      <span className="text-[10px] text-gray-400">{pct}%</span>
                      <span className="text-[11px] font-medium text-red-500 w-20 text-right">{money(t.total - t.paid, b.currency)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

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
                  <button key={m.id} onClick={() => onOpenBride(b.id)} className="w-full flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 text-left">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${days <= 7 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <span className="text-[11px] text-gray-700 flex-1 truncate">
                      <span className="font-medium">{b.name.split(' ')[0]}</span> · {label(m)}
                    </span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}</span>
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
                const ws = projects.filter(p => p.bride_id === b.id).length
                return (
                  <button key={b.id} onClick={() => onOpenBride(b.id)} className="w-full flex items-center gap-2 py-2 px-1 rounded hover:bg-gray-50 text-left">
                    <Avatar initials={b.initials || initialsOf(b.name)} color="blue" sm />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {prettyDate(b.wedding_date)} · {ws} workstream{ws === 1 ? '' : 's'}
                        {mine.length > 0 && ` · ${done}/${mine.length} done`}
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

function CalendarPanel({ brides, projects, milestones, onOpenBride }: {
  brides: Bride[]
  projects: Project[]
  milestones: Milestone[]
  onOpenBride: (id: string) => void
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

  const projectById = useMemo(() => {
    const map: Record<string, Project> = {}
    projects.forEach(p => { map[p.id] = p })
    return map
  }, [projects])

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
      const proj = m.project_id ? projectById[m.project_id] : null
      if (!map[m.due_date]) map[m.due_date] = []
      map[m.due_date].push({ kind: 'milestone', label: proj ? `${proj.name} · ${m.label}` : m.label, bride: b, done: m.done })
    })
    return map
  }, [brides, milestones, brideById, projectById])

  const first = new Date(year, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const tKey = todayKey()

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth()); setPicked(null)
  }

  const pickedEvents = picked ? eventsByDay[picked] || [] : []

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
                <button key={i} onClick={() => onOpenBride(e.bride.id)} className="w-full flex items-center gap-1.5 text-[10px] py-1 px-1 rounded hover:bg-gray-50 text-left">
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
      </div>
    </Panel>
  )
}

function Books({ brides, projects }: { brides: Bride[]; projects: Project[] }) {
  const brideById: Record<string, Bride> = {}
  brides.forEach(b => { brideById[b.id] = b })
  const byCurrency: Record<string, { total: number; paid: number; profit: number }> = {}
  projects.forEach(p => {
    const cur = brideById[p.bride_id]?.currency || 'MYR'
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, paid: 0, profit: 0 }
    byCurrency[cur].total += p.total || 0
    byCurrency[cur].paid += p.paid || 0
    byCurrency[cur].profit += (p.total || 0) * (p.margin || 0) / 100
  })
  const currencyKeys = Object.keys(byCurrency).length ? Object.keys(byCurrency).sort() : ['MYR']

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold">Books</h1>
          <p className="text-[11px] text-gray-400">Revenue by workstream</p>
        </div>
        <span className="text-[10px] text-gray-400">🔒 Admin only</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total contracted', cls: '', lines: currencyKeys.map(c => money(byCurrency[c]?.total || 0, c)) },
          { label: 'Collected', cls: 'text-emerald-600', lines: currencyKeys.map(c => money(byCurrency[c]?.paid || 0, c)) },
          { label: 'Outstanding', cls: 'text-red-500', lines: currencyKeys.map(c => money((byCurrency[c]?.total || 0) - (byCurrency[c]?.paid || 0), c)) },
          { label: 'Est. gross profit', cls: '', lines: currencyKeys.map(c => money(Math.round(byCurrency[c]?.profit || 0), c)) },
        ].map(cell => (
          <div key={cell.label} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[9px] text-gray-400">{cell.label}</p>
            {cell.lines.map((v, i) => (
              <p key={i} className={`${currencyKeys.length > 1 ? 'text-sm' : 'text-lg'} font-semibold ${cell.cls}`}>{v}</p>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {brides.map(b => {
          const mine = projects.filter(p => p.bride_id === b.id)
          if (!mine.length) return null
          const t = brideTotals(mine)
          return (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5">
                <Avatar initials={b.initials || initialsOf(b.name)} color="blue" sm />
                <span className="text-xs font-medium text-gray-800">{b.name}</span>
                <span className="ml-auto text-[10px] text-gray-400">{money(t.total, b.currency)} · {t.total ? Math.round((t.paid / t.total) * 100) : 0}% paid</span>
              </div>
              <div className="grid grid-cols-6 px-4 py-2 text-[10px] text-gray-400 gap-2 border-t border-gray-50">
                <span className="col-span-2">Workstream</span><span>Contract</span><span>Paid</span><span>Outstanding</span><span>Margin</span>
              </div>
              {mine.map(p => (
                <div key={p.id} className="grid grid-cols-6 items-center px-4 py-2.5 border-t border-gray-50 gap-2">
                  <div className="col-span-2 min-w-0">
                    <p className="text-xs text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{p.designer || 'No designer'}{p.service ? ` · ${p.service}` : ''}</p>
                  </div>
                  <span className="text-xs">{money(p.total, b.currency)}</span>
                  <span className="text-xs text-emerald-600">{money(p.paid, b.currency)}</span>
                  <span className="text-xs text-red-500">{money((p.total || 0) - (p.paid || 0), b.currency)}</span>
                  <span className="text-xs">{p.margin || 0}%</span>
                </div>
              ))}
            </div>
          )
        })}
        {projects.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">No financial data yet</div>
        )}
      </div>
    </div>
  )
}

function DesignerPortal({ brides, projects, milestones, profile, selectedBrideId, setSelectedBrideId, onSaved }: {
  brides: Bride[]
  projects: Project[]
  milestones: Milestone[]
  profile: Profile
  isDesigner: boolean
  selectedBrideId: string | null
  setSelectedBrideId: (id: string | null) => void
  onSaved: () => void
}) {
  const today = todayKey()

  const brideById: Record<string, Bride> = {}
  brides.forEach(b => { brideById[b.id] = b })
  const projectById: Record<string, Project> = {}
  projects.forEach(p => { projectById[p.id] = p })

  const selectedBride = brides.find(b => b.id === selectedBrideId) || null
  if (selectedBride) {
    return (
      <BrideDetail
        bride={selectedBride}
        projects={projects.filter(p => p.bride_id === selectedBride.id)}
        milestones={milestones}
        designers={[]}
        onBack={() => setSelectedBrideId(null)}
        onSaved={onSaved}
        canSeeMoney={false}
      />
    )
  }

  const overdue = milestones.filter(m => !m.done && m.due_date && m.due_date < today)
  const dueSoon = milestones.filter(m => !m.done && m.due_date && m.due_date >= today && m.due_date <= addDaysKey(7))
  const bridesWithWork = brides.filter(b => projects.some(p => p.bride_id === b.id))

  return (
    <div>
      <h1 className="text-base font-semibold mb-1">
        Hello, {(profile.full_name || 'there').split(' ')[0]}
      </h1>
      <p className="text-[11px] text-gray-400 mb-4">
        Designer portal · {projects.length} workstream{projects.length === 1 ? '' : 's'} assigned to you
      </p>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4">
          <p className="text-xs font-semibold text-red-800 mb-2">⚠️ {overdue.length} overdue</p>
          <div className="space-y-1">
            {overdue.map(m => {
              const b = brideById[m.bride_id]
              const p = m.project_id ? projectById[m.project_id] : null
              if (!b) return null
              const late = daysBetween(m.due_date || today, today)
              return (
                <button key={m.id} onClick={() => setSelectedBrideId(b.id)} className="w-full flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-red-100/60 text-left">
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{p ? `${p.name} · ` : ''}{m.label}</span>
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
              const p = m.project_id ? projectById[m.project_id] : null
              if (!b) return null
              return (
                <button key={m.id} onClick={() => setSelectedBrideId(b.id)} className="w-full flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-amber-100/60 text-left">
                  <span className="font-medium text-gray-800">{b.name}</span>
                  <span className="text-gray-600">{p ? `${p.name} · ` : ''}{m.label}</span>
                  <span className="ml-auto text-amber-700">{shortDate(m.due_date)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">My brides</p>
      {bridesWithWork.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">No workstreams assigned to you yet</p>
          <p className="text-xs text-gray-400 mt-1">Roéma will assign your pieces from the bride record</p>
        </div>
      ) : bridesWithWork.map(b => {
        const mine = projects.filter(p => p.bride_id === b.id)
        return (
          <button key={b.id} onClick={() => setSelectedBrideId(b.id)} className="lift w-full text-left bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:border-gray-300">
            <div className="flex items-center gap-2 mb-2">
              <Avatar initials={b.initials || initialsOf(b.name)} color="teal" />
              <div>
                <p className="text-sm font-medium">{b.name}</p>
                <p className="text-[10px] text-gray-400">Wedding {prettyDate(b.wedding_date)}</p>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-gray-100 pt-2">
              {mine.map(p => {
                const ms = milestones.filter(m => m.project_id === p.id)
                const done = ms.filter(m => m.done).length
                const next = ms.find(m => !m.done)
                return (
                  <div key={p.id} className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{p.name}</span>
                      <span className="ml-auto"><Badge label={p.status} color={p.status_color} /></span>
                    </div>
                    {next && <p className="text-[10px] text-gray-400 mt-0.5">Next: {next.label} · {prettyDate(next.due_date)}</p>}
                    {ms.length > 0 && (
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(done / ms.length) * 100}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {b.gatekeeper && <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-2">🔒 Gatekeeper: {b.gatekeeper}</p>}
          </button>
        )
      })}
    </div>
  )
}

function BridePortal({ brides, projects, milestones, isRealBride, profile, previewBrideId, setPreviewBrideId }: {
  brides: Bride[]
  projects: Project[]
  milestones: Milestone[]
  isRealBride: boolean
  profile: Profile
  previewBrideId: string
  setPreviewBrideId: (id: string) => void
}) {
  const b = isRealBride
    ? brides.find(x => x.id === profile.bride_id) || null
    : brides.find(x => x.id === previewBrideId) || brides[0] || null

  const [openWs, setOpenWs] = useState<string | null>(null)

  if (!b) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
        <p className="text-sm text-gray-500">No bride record linked to this account</p>
        <p className="text-xs text-gray-400 mt-1">A Roéma admin needs to link your login to your record</p>
      </div>
    )
  }

  const mine = projects.filter(p => p.bride_id === b.id)
  const t = brideTotals(mine)
  const pct = t.total ? Math.round((t.paid / t.total) * 100) : 0
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

      {mine.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Your workstreams will appear here shortly
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {mine.map(p => {
            const ms = milestones.filter(m => m.project_id === p.id)
            const done = ms.filter(m => m.done).length
            const next = ms.find(m => !m.done)
            const isOpen = openWs === p.id
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenWs(isOpen ? null : p.id)} className="row-mark w-full p-4 text-left hover:bg-gray-50">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <Badge label={p.status} color={p.status_color} />
                    {p.engagement_type === 'Rental' && <Badge label="Rental" color="coral" />}
                    <span className="ml-auto text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Designed by {p.designer || 'your Roéma team'}</p>
                  {p.service && <p className="text-[10px] text-gray-400 mt-0.5">{p.service}</p>}
                  {next && <p className="text-[11px] text-amber-700 mt-1">Next: {next.label}{next.due_date ? ` · ${prettyDate(next.due_date)}` : ''}</p>}
                  {ms.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(done / ms.length) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{done} of {ms.length} milestones complete</p>
                    </div>
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    {p.brief && (
                      <div className="mb-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Design brief</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.brief}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Timeline</p>
                    {ms.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Timeline coming soon</p>
                    ) : (
                      <div className="space-y-0">
                        {ms.map((m, i) => {
                          const isNext = !m.done && ms.findIndex(x => !x.done) === i
                          return (
                            <div key={m.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 ${
                                  m.done ? 'bg-emerald-500 border-emerald-500' : isNext ? 'bg-white border-amber-400' : 'bg-white border-gray-200'
                                }`} />
                                {i < ms.length - 1 && <div className={`w-px flex-1 min-h-[24px] ${m.done ? 'bg-emerald-200' : 'bg-gray-200'}`} />}
                              </div>
                              <div className="flex-1 pb-3">
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
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Payments — all workstreams</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Total</p><p className="text-base font-semibold">{money(t.total, b.currency)}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Paid</p><p className="text-base font-semibold text-emerald-600">{money(t.paid, b.currency)}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Outstanding</p><p className="text-base font-semibold text-red-500">{money(t.total - t.paid, b.currency)}</p></div>
        </div>
        {mine.length > 1 && (
          <div className="space-y-1 mb-3 pt-2 border-t border-gray-100">
            {mine.map(p => (
              <div key={p.id} className="flex items-center text-[11px]">
                <span className="text-gray-600 flex-1">{p.name}</span>
                <span className="text-gray-400 mr-3">{money(p.paid, b.currency)} of {money(p.total, b.currency)}</span>
              </div>
            ))}
          </div>
        )}
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
          <li>Pick their role. Brides also need linking to their record.</li>
        </ol>
        <p className="text-[10px] text-gray-400 mt-3">
          Designers only see workstreams assigned to them. Assign from the bride record — open a workstream and pick the designer from the dropdown.
        </p>
      </div>
    </div>
  )
}

function AddBrideForm({ designers, onDone, onCancel }: { designers: DesignerAccount[]; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', location: '', wedding_date: '', kyc: '', gatekeeper: '', currency: 'MYR', wsName: 'Main gown', wsDesigner: '', wsDesignerId: '', wsService: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!f.name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    const { data, error } = await supabase.from('brides').insert({
      name: f.name.trim(), initials: initialsOf(f.name), location: f.location || null,
      wedding_date: f.wedding_date || null, kyc: f.kyc || null, gatekeeper: f.gatekeeper || null,
      currency: f.currency,
    }).select().single()
    if (error) { setSaving(false); setErr(error.message); return }
    if (data && f.wsName.trim()) {
      await supabase.from('projects').insert({
        bride_id: (data as Bride).id, name: f.wsName.trim(),
        designer: f.wsDesigner || null, designer_id: f.wsDesignerId || null,
        service: f.wsService || null, sort_order: 0,
      })
    }
    setSaving(false)
    onDone()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <p className="text-sm font-medium mb-1">New bride</p>
      <p className="text-[11px] text-gray-400 mb-3">Client details. You can add more workstreams after.</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="text-[10px] text-gray-400 block mb-1">Name *</label><input className={input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Full name" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input type="date" className={input} value={f.wedding_date} onChange={e => setF({ ...f, wedding_date: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Gatekeeper 🔒</label><input className={input} value={f.gatekeeper} onChange={e => setF({ ...f, gatekeeper: e.target.value })} placeholder="Who signs off" /></div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">Billing currency</label>
          <select className={input} value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <p className="text-[9px] text-gray-400 mt-1">MYR Malaysia · SGD Singapore · USD international</p>
        </div>
      </div>
      <div className="mb-3">
        <label className="text-[10px] text-gray-400 block mb-1">KYC / internal notes 🔒</label>
        <textarea rows={2} className={input + ' resize-none'} value={f.kyc} onChange={e => setF({ ...f, kyc: e.target.value })} />
      </div>
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">First workstream</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Workstream</label>
            <WorkstreamNameField className={input} value={f.wsName} onChange={v => setF({ ...f, wsName: v })} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Designer</label>
            <select className={input} value={f.wsDesignerId}
              onChange={e => {
                const d = designers.find(x => x.id === e.target.value)
                setF({ ...f, wsDesignerId: e.target.value, wsDesigner: d ? (d.full_name || d.email) : '' })
              }}>
              <option value="">Unassigned</option>
              {designers.map(d => <option key={d.id} value={d.id}>{d.full_name || d.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Service (from the pricing deck)</label>
            <select className={input} value={f.wsService} onChange={e => setF({ ...f, wsService: e.target.value })}>
              <option value="">Not set</option>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
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
  'Kickoff (confirm offerings)',
  'Moodboard + Brief',
  'Bill deposit',
  'Sketches / design concept released',
  'Design sign-off',
  'Fabric sourcing',
  'Production of dummy dress & status updates from designer',
  'First fitting (toile)',
  'Bill first 50%',
  'Second fitting',
  'Final fitting',
  'Bill balance 50%',
  'Delivery / handover',
]

function TimelineEditor({ brideId, projectId }: { brideId: string; projectId: string }) {
  const [items, setItems] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('timeline_steps').select('*').eq('project_id', projectId)
      .order('sort_order', { ascending: true })
    setItems((data as Milestone[]) || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!label.trim()) { setErr('Give the milestone a name'); return }
    setBusy(true); setErr('')
    const nextOrder = items.length ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 0
    const { error } = await supabase.from('timeline_steps').insert({
      bride_id: brideId, project_id: projectId, label: label.trim(), due_date: due || null, done: false, sort_order: nextOrder,
    })
    setBusy(false)
    if (error) { setErr(error.message); return }
    setLabel(''); setDue(''); load()
  }

  async function addPreset() {
    setBusy(true); setErr('')
    const rows = PRESET_TIMELINE.map((l, i) => ({
      bride_id: brideId, project_id: projectId, label: l, due_date: null, done: false, sort_order: i,
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
        <p className="text-xs text-gray-500">Milestones for this workstream</p>
        {items.length > 0 && <span className="text-[10px] text-gray-400">{doneCount}/{items.length} complete</span>}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-6 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center mb-4">
          <p className="text-xs text-gray-500 mb-3">No milestones yet</p>
          <button onClick={addPreset} disabled={busy}
            className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
            {busy ? 'Adding…' : `Use standard ${PRESET_TIMELINE.length}-step timeline`}
          </button>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          {items.map((m, i) => {
            const isLate = !m.done && m.due_date && m.due_date < today
            return (
              <div key={m.id} className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${isLate ? 'bg-red-50/40' : ''}`}>
                <button onClick={() => toggle(m)}
                  className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${m.done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300 hover:border-emerald-400'}`}>
                  {m.done && <span className="text-white text-[9px] leading-none">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${m.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {m.label}{isLate && <span className="text-[9px] text-red-600 ml-2">overdue</span>}
                  </p>
                </div>
                <input type="date" value={m.due_date || ''} onChange={e => setDate(m, e.target.value)}
                  className="text-[10px] px-1.5 py-1 rounded border border-gray-200 text-gray-500 w-[110px]" />
                <div className="flex items-center gap-1">
                  <button onClick={() => move(m, -1)} disabled={i === 0} className="text-[10px] w-5 h-5 rounded border border-gray-200 text-gray-400 hover:bg-white disabled:opacity-30">↑</button>
                  <button onClick={() => move(m, 1)} disabled={i === items.length - 1} className="text-[10px] w-5 h-5 rounded border border-gray-200 text-gray-400 hover:bg-white disabled:opacity-30">↓</button>
                  <button onClick={() => remove(m.id)} className="text-[10px] px-2 h-5 rounded border border-red-100 text-red-500 hover:bg-red-50">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex gap-2 flex-wrap">
          <input className={input + ' flex-1 min-w-[160px]'} value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add a milestone…" />
          <input type="date" className={input} value={due} onChange={e => setDue(e.target.value)} />
          <button onClick={add} disabled={busy} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">Add</button>
        </div>
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      </div>
    </div>
  )
}

function BrideDetail({ bride, projects, milestones, designers, onBack, onSaved, canDelete, canSeeMoney, canEditClient }: {
  bride: Bride
  projects: Project[]
  milestones: Milestone[]
  designers: DesignerAccount[]
  onBack: () => void
  onSaved: () => void
  canDelete?: boolean
  canSeeMoney?: boolean
  canEditClient?: boolean
}) {
  const [tab, setTab] = useState('workstreams')
  const [openProject, setOpenProject] = useState<string | null>(projects[0]?.id || null)
  const [showAddWs, setShowAddWs] = useState(false)
  const [b, setB] = useState(bride)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { setB(bride) }, [bride])

  const t = brideTotals(projects)

  async function saveBride() {
    setSaving(true)
    const { error } = await supabase.from('brides').update({
      name: b.name, initials: initialsOf(b.name), location: b.location,
      wedding_date: b.wedding_date || null, kyc: b.kyc, gatekeeper: b.gatekeeper,
      currency: b.currency || 'MYR',
    }).eq('id', bride.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved ✓')
    setTimeout(() => setMsg(''), 2000)
    if (!error) onSaved()
  }

  async function removeBride() {
    if (!confirm(`Delete ${bride.name} and all her workstreams? This cannot be undone.`)) return
    await supabase.from('brides').delete().eq('id', bride.id)
    onSaved(); onBack()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'
  const tabs = [['workstreams', `Workstreams (${projects.length})`], ['details', 'Client details'], ['notes', 'Internal notes']]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{bride.name}</span>
        <span className="text-[10px] text-gray-400">Wedding {prettyDate(bride.wedding_date)}</span>
        {canSeeMoney && t.total > 0 && (
          <span className="text-[10px] text-gray-400">· {money(t.total, bride.currency)} total · {Math.round((t.paid / t.total) * 100)}% paid</span>
        )}
      </div>

      <div className="flex gap-1.5 mb-4 pb-3 border-b border-gray-100 flex-wrap">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1 text-xs rounded-lg border ${tab === id ? 'bg-gray-100 font-medium border-gray-200' : 'text-gray-400 border-gray-100 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'workstreams' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-gray-400">Each workstream has its own designer, timeline and payments</p>
            {canEditClient && (
              <button onClick={() => setShowAddWs(true)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">+ Add workstream</button>
            )}
          </div>

          {showAddWs && (
            <AddWorkstreamForm brideId={bride.id} nextOrder={projects.length} designers={designers}
              onDone={() => { setShowAddWs(false); onSaved() }} onCancel={() => setShowAddWs(false)} />
          )}

          {projects.length === 0 && !showAddWs && (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500 mb-1">No workstreams yet</p>
              <p className="text-xs text-gray-400">Add one for each gown or garment you are managing</p>
            </div>
          )}

          <div className="space-y-3">
            {projects.map((p, i) => (
              <WorkstreamCard
                key={p.id} project={p} index={i} brideId={bride.id} currency={bride.currency} designers={designers}
                milestones={milestones.filter(m => m.project_id === p.id)}
                isOpen={openProject === p.id}
                onToggle={() => setOpenProject(openProject === p.id ? null : p.id)}
                onSaved={onSaved} canSeeMoney={canSeeMoney} canDelete={canDelete}
                canAssign={canEditClient}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'details' && (
        canEditClient ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="text-[10px] text-gray-400 block mb-1">Name</label><input className={input} value={b.name} onChange={e => setB({ ...b, name: e.target.value })} /></div>
              <div><label className="text-[10px] text-gray-400 block mb-1">Location</label><input className={input} value={b.location || ''} onChange={e => setB({ ...b, location: e.target.value })} /></div>
              <div><label className="text-[10px] text-gray-400 block mb-1">Wedding date</label><input type="date" className={input} value={b.wedding_date || ''} onChange={e => setB({ ...b, wedding_date: e.target.value })} /></div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Billing currency</label>
                <select className={input} value={b.currency || 'MYR'} onChange={e => setB({ ...b, currency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <p className="text-[9px] text-gray-400 mt-1">MYR Malaysia · SGD Singapore · USD international — applies to all her workstreams</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveBride} disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save details'}
              </button>
              {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Name" value={b.name} />
            <InfoCard label="Location" value={b.location} />
            <InfoCard label="Wedding date" value={prettyDate(b.wedding_date)} />
          </div>
        )
      )}

      {tab === 'notes' && (
        <div>
          <p className="text-xs text-gray-400 mb-3">🔒 Roéma and designers only — never shown to the bride</p>
          {canEditClient ? (
            <>
              <div className="mb-3">
                <label className="text-[10px] text-gray-400 block mb-1">KYC profile</label>
                <textarea rows={4} className={input + ' resize-none'} value={b.kyc || ''} onChange={e => setB({ ...b, kyc: e.target.value })}
                  placeholder="Preferences, sensitivities, how she likes to communicate…" />
              </div>
              <div className="mb-4">
                <label className="text-[10px] text-gray-400 block mb-1">Gatekeeper</label>
                <input className={input} value={b.gatekeeper || ''} onChange={e => setB({ ...b, gatekeeper: e.target.value })} placeholder="Who signs off decisions" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={saveBride} disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save notes'}
                </button>
                {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
                {canDelete && (
                  <button onClick={removeBride} className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    Delete bride
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">KYC profile</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{b.kyc || 'Nothing recorded'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Gatekeeper</p>
                <p className="text-sm text-gray-700">{b.gatekeeper || 'Nothing recorded'}</p>
              </div>
              <p className="text-[10px] text-gray-400">Read only — contact Roéma to update client notes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WorkstreamCard({ project, index, brideId, currency, designers, milestones, isOpen, onToggle, onSaved, canSeeMoney, canDelete, canAssign }: {
  project: Project
  index: number
  brideId: string
  currency: string | null
  designers: DesignerAccount[]
  milestones: Milestone[]
  isOpen: boolean
  onToggle: () => void
  onSaved: () => void
  canSeeMoney?: boolean
  canDelete?: boolean
  canAssign?: boolean
}) {
  const [p, setP] = useState(project)
  const [tab, setTab] = useState('brief')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { setP(project) }, [project])

  const done = milestones.filter(m => m.done).length
  const next = milestones.find(m => !m.done)
  const overdue = milestones.filter(m => !m.done && m.due_date && m.due_date < todayKey()).length

  async function save() {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: p.name, status: p.status, status_color: p.status_color, brief: p.brief,
    }
    if (canAssign) {
      payload.designer = p.designer
      payload.designer_id = p.designer_id
      payload.service = p.service || null
      payload.engagement_type = p.engagement_type || 'Bespoke'
    }
    if (canSeeMoney) {
      payload.total = Number(p.total) || 0
      payload.paid = Number(p.paid) || 0
      payload.margin = Number(p.margin) || 0
    }
    const { error } = await supabase.from('projects').update(payload).eq('id', project.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved ✓')
    setTimeout(() => setMsg(''), 2000)
    if (!error) onSaved()
  }

  async function remove() {
    if (!confirm(`Delete the "${project.name}" workstream and its timeline?`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    onSaved()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'
  const wsTabs = canSeeMoney
    ? [['brief', 'Brief'], ['timeline', 'Timeline'], ['payments', 'Payments']]
    : [['brief', 'Brief'], ['timeline', 'Timeline']]

  return (
    <div className={`border rounded-xl overflow-hidden ${isOpen ? 'border-gray-300 shadow-sm' : 'border-gray-200'}`}>
      <button onClick={onToggle} className="row-mark w-full p-4 text-left hover:bg-gray-50">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-gray-300 text-xs">{index + 1}.</span>
          <p className="text-sm font-semibold text-gray-900">{project.name}</p>
          <Badge label={project.status} color={project.status_color} />
          {project.engagement_type === 'Rental' && <Badge label="Rental" color="coral" />}
          {overdue > 0 && <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">{overdue} overdue</span>}
          <span className="ml-auto text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[11px] text-gray-500">👤 {project.designer || 'No designer assigned'}</p>
          {project.service && <p className="text-[11px] text-gray-400">✦ {project.service}</p>}
          {canSeeMoney && project.total > 0 && (
            <p className="text-[11px] text-gray-400">{money(project.paid, currency)} of {money(project.total, currency)}</p>
          )}
          {milestones.length > 0 && <p className="text-[11px] text-gray-400">{done}/{milestones.length} milestones</p>}
        </div>
        {next && <p className="text-[11px] text-amber-700 mt-1">Next: {next.label}{next.due_date ? ` · ${prettyDate(next.due_date)}` : ''}</p>}
        {milestones.length > 0 && (
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(done / milestones.length) * 100}%` }} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/40">
          <div className="flex gap-1.5 mb-3 flex-wrap items-center">
            {wsTabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border ${tab === id ? 'bg-white font-medium border-gray-200' : 'text-gray-400 border-transparent hover:bg-white/60'}`}>
                {label}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2">
              {msg && <span className="text-[10px] text-emerald-600">{msg}</span>}
              <button onClick={save} disabled={saving} className="text-[11px] px-3 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </span>
          </div>

          {tab === 'brief' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Workstream name</label>
                <WorkstreamNameField className={input} value={p.name} onChange={v => setP({ ...p, name: v })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Designer</label>
                {canAssign ? (
                  <>
                    <select className={input} value={p.designer_id || ''}
                      onChange={e => {
                        const d = designers.find(x => x.id === e.target.value)
                        setP({ ...p, designer_id: e.target.value || null, designer: d ? (d.full_name || d.email) : '' })
                      }}>
                      <option value="">Unassigned</option>
                      {designers.map(d => <option key={d.id} value={d.id}>{d.full_name || d.email}</option>)}
                    </select>
                    {designers.length === 0 && (
                      <p className="text-[9px] text-amber-600 mt-1">No designer accounts yet — add them in Team first</p>
                    )}
                  </>
                ) : (
                  <div className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600">{p.designer || 'Unassigned'}</div>
                )}
              </div>
              <div><label className="text-[10px] text-gray-400 block mb-1">Service (from the pricing deck)</label>
                {canAssign ? (
                  <select className={input} value={p.service || ''} onChange={e => setP({ ...p, service: e.target.value || null })}>
                    <option value="">Not set</option>
                    {SERVICES.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <div className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600">{p.service || 'Not set'}</div>
                )}
              </div>
              <div><label className="text-[10px] text-gray-400 block mb-1">Bespoke or rental</label>
                {canAssign ? (
                  <select className={input} value={p.engagement_type || 'Bespoke'} onChange={e => setP({ ...p, engagement_type: e.target.value })}>
                    {ENGAGEMENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <div className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600">{p.engagement_type || 'Bespoke'}</div>
                )}
              </div>
              <div><label className="text-[10px] text-gray-400 block mb-1">Status</label>
                <select className={input} value={p.status} onChange={e => setP({ ...p, status: e.target.value })}>
                  {statusOptionsFor(p.service, p.status).map(s => <option key={s}>{s}</option>)}
                </select>
                {!isRCL(p.service) && <p className="text-[9px] text-gray-400 mt-1">&ldquo;In progress&rdquo; unlocks when the service is RCL</p>}
              </div>
              <div><label className="text-[10px] text-gray-400 block mb-1">Status colour</label>
                <select className={input} value={p.status_color} onChange={e => setP({ ...p, status_color: e.target.value })}>
                  <option value="blue">Blue</option><option value="amber">Amber</option><option value="teal">Teal</option><option value="coral">Coral</option><option value="green">Green</option><option value="purple">Purple</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 block mb-1">Design brief — visible to the bride</label>
                <textarea rows={4} className={input + ' resize-none'} value={p.brief || ''} onChange={e => setP({ ...p, brief: e.target.value })}
                  placeholder="Silhouette, fabric, colourway…" />
              </div>
              {canDelete && (
                <div className="col-span-2">
                  <button onClick={remove} className="text-[11px] px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    Delete this workstream
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'timeline' && <TimelineEditor brideId={brideId} projectId={project.id} />}

          {tab === 'payments' && canSeeMoney && (
            <div>
              <p className="text-[10px] text-gray-400 mb-2">Billed in {currency || 'MYR'} — change it under the bride&rsquo;s Client details</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><label className="text-[10px] text-gray-400 block mb-1">Contract total ({currency || 'MYR'})</label><input type="number" className={input} value={p.total || 0} onChange={e => setP({ ...p, total: Number(e.target.value) })} /></div>
                <div><label className="text-[10px] text-gray-400 block mb-1">Amount paid ({currency || 'MYR'})</label><input type="number" className={input} value={p.paid || 0} onChange={e => setP({ ...p, paid: Number(e.target.value) })} /></div>
                <div><label className="text-[10px] text-gray-400 block mb-1">Margin %</label><input type="number" className={input} value={p.margin || 0} onChange={e => setP({ ...p, margin: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[['Contract', money(p.total, currency), ''], ['Collected', money(p.paid, currency), 'text-emerald-600'], ['Outstanding', money((p.total || 0) - (p.paid || 0), currency), 'text-red-500']].map(([l, v, c], i) => (
                  <div key={i} className="bg-white rounded-lg p-2.5"><p className="text-[9px] text-gray-400">{l}</p><p className={`text-sm font-semibold ${c}`}>{v}</p></div>
                ))}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.total ? Math.min(100, (p.paid / p.total) * 100) : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddWorkstreamForm({ brideId, nextOrder, designers, onDone, onCancel }: {
  brideId: string; nextOrder: number; designers: DesignerAccount[]; onDone: () => void; onCancel: () => void
}) {
  const [f, setF] = useState({ name: '', designer: '', designerId: '', total: '', paid: '', margin: '', status: 'Brief confirmed', status_color: 'teal', brief: '', service: '', engagement_type: 'Bespoke' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!f.name.trim()) { setErr('Give the workstream a name'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('projects').insert({
      bride_id: brideId, name: f.name.trim(),
      designer: f.designer || null, designer_id: f.designerId || null,
      status: f.status, status_color: f.status_color, brief: f.brief || null,
      service: f.service || null, engagement_type: f.engagement_type,
      total: Number(f.total) || 0, paid: Number(f.paid) || 0, margin: Number(f.margin) || 0,
      sort_order: nextOrder,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    onDone()
  }

  const input = 'w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300'

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 mb-3">
      <p className="text-sm font-medium mb-3">New workstream</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">Workstream *</label>
          <WorkstreamNameField className={input} value={f.name} onChange={v => setF({ ...f, name: v })} />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">Designer</label>
          <select className={input} value={f.designerId}
            onChange={e => {
              const d = designers.find(x => x.id === e.target.value)
              setF({ ...f, designerId: e.target.value, designer: d ? (d.full_name || d.email) : '' })
            }}>
            <option value="">Unassigned</option>
            {designers.map(d => <option key={d.id} value={d.id}>{d.full_name || d.email}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Service (from the pricing deck)</label>
          <select className={input} value={f.service} onChange={e => setF({ ...f, service: e.target.value })}>
            <option value="">Not set</option>
            {SERVICES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Bespoke or rental</label>
          <select className={input} value={f.engagement_type} onChange={e => setF({ ...f, engagement_type: e.target.value })}>
            {ENGAGEMENTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Status</label>
          <select className={input} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            {statusOptionsFor(f.service, f.status).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Status colour</label>
          <select className={input} value={f.status_color} onChange={e => setF({ ...f, status_color: e.target.value })}>
            <option value="teal">Teal</option><option value="blue">Blue</option><option value="amber">Amber</option><option value="coral">Coral</option><option value="green">Green</option><option value="purple">Purple</option>
          </select>
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Contract total</label><input type="number" className={input} value={f.total} onChange={e => setF({ ...f, total: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Amount paid</label><input type="number" className={input} value={f.paid} onChange={e => setF({ ...f, paid: e.target.value })} /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Margin %</label><input type="number" className={input} value={f.margin} onChange={e => setF({ ...f, margin: e.target.value })} /></div>
      </div>
      <div className="mb-3">
        <label className="text-[10px] text-gray-400 block mb-1">Design brief</label>
        <textarea rows={2} className={input + ' resize-none'} value={f.brief} onChange={e => setF({ ...f, brief: e.target.value })} />
      </div>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Add workstream'}</button>
        <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )
}
