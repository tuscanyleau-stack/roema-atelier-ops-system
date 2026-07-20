'use client'
import { useState } from 'react'
import { ViewType, RoemaNav } from '@/lib/types'
import { PROSPECTS, BRIDES, OVERDUE_ITEMS, ACTIVITY_FEED, COMMS_GAPS, LOGISTICS, TEAM_TRAVEL, CALENDAR_EVENTS } from '@/lib/data'
import { STATUS_COLORS, AVATAR_COLORS, formatCurrency, getProspectStatusConfig } from '@/lib/utils'
import { StatusColor } from '@/lib/types'

function Avatar({ initials, color, size = 'md' }: { initials: string; color: StatusColor; size?: 'sm'|'md' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
  return <div className={`rounded-full flex items-center justify-center font-medium flex-shrink-0 ${AVATAR_COLORS[color]} ${s}`}>{initials}</div>
}

function Badge({ label, color }: { label: string; color: StatusColor }) {
  const c = STATUS_COLORS[color]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{label}</span>
}

export default function CRMApp() {
  const [view, setView] = useState<ViewType>('roema')
  const [nav, setNav] = useState<RoemaNav>('dashboard')
  const [brideId, setBrideId] = useState<number|null>(null)
  const [brideTab, setBrideTab] = useState('brief')
  const [bridePortalTab, setBridePortalTab] = useState('timeline')

  const changeView = (v: ViewType) => { setView(v); setNav('dashboard'); setBrideId(null) }
  const changeNav = (n: RoemaNav) => { setNav(n); setBrideId(null) }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Portal switcher */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-gray-400">Portal:</span>
          {(['roema','designer','bride'] as ViewType[]).map(p => (
            <button key={p} onClick={() => changeView(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${view===p ? 'bg-gray-100 font-medium border-gray-300 text-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              {p==='roema'?'👑 Roéma':p==='designer'?'🪡 Designer':'💎 Bride'}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>5 automations active
          </div>
        </div>

        <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm min-h-[600px]">
          {/* Sidebar */}
          {view==='roema' && (
            <div className="w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
              <div className="px-3.5 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-800">Roéma Atelier</p>
                <p className="text-[10px] text-gray-400">Master portal</p>
              </div>
              <nav className="flex-1 py-1">
                {([['dashboard','▦','Dashboard'],['prospects','📱','Prospects'],['brides','♡','Brides'],['books','📖','Books'],['team','👥','Team & settings']] as [RoemaNav,string,string][]).map(([id,icon,label])=>(
                  <button key={id} onClick={()=>changeNav(id)}
                    className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left transition-colors ${nav===id?'bg-white text-gray-900 font-medium border-r-2 border-amber-500':'text-gray-500 hover:bg-gray-100'}`}>
                    <span>{icon}</span><span className="flex-1">{label}</span>
                    {id==='prospects'&&<span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{PROSPECTS.length}</span>}
                  </button>
                ))}
              </nav>
              <div className="px-3.5 py-3 border-t border-gray-200 space-y-1">
                <div className="text-[9px] text-emerald-600">⚡ WA auto-intake on</div>
                <div className="text-[9px] text-emerald-600">✉️ Alert emails active</div>
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 p-5 overflow-auto min-w-0">
            {view==='roema' && nav==='dashboard' && <Dashboard/>}
            {view==='roema' && nav==='prospects' && <ProspectsView/>}
            {view==='roema' && nav==='brides' && !brideId && <BridesList onSelect={setBrideId}/>}
            {view==='roema' && nav==='brides' && brideId && <BrideDetail id={brideId} onBack={()=>setBrideId(null)} tab={brideTab} setTab={setBrideTab}/>}
            {view==='roema' && nav==='books' && <Books/>}
            {view==='roema' && nav==='team' && <Team/>}
            {view==='designer' && <DesignerView/>}
            {view==='bride' && <BridePortal tab={bridePortalTab} setTab={setBridePortalTab}/>}
          </main>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Dashboard</h1>
        <span className="text-xs text-gray-400">May 11, 2026</span>
      </div>
      {OVERDUE_ITEMS.length>0&&(
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-800 mb-2">⚠️ {OVERDUE_ITEMS.length} overdue — alerts auto-sent to PIC</p>
          {OVERDUE_ITEMS.map((item,i)=>(
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs py-0.5">
              <Badge label={item.bride} color={item.statusColor}/>
              <span className="text-gray-700">{item.item}</span>
              <span className="text-red-700 font-medium">{item.daysOverdue}d overdue</span>
              <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">✉️ emailed {item.email}</span>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <p className="text-[10px] text-gray-400 mb-2">Pipeline funnel</p>
        <div className="flex overflow-hidden rounded-lg">
          {[['Prospects',3,'amber','📱'],['Brief',2,'blue','📋'],['Production',2,'teal','🧵'],['Fitting',1,'coral','👗'],['Delivered',0,'green','📦']].map(([l,n,c,ic],i,arr)=>{
            const col=STATUS_COLORS[c as StatusColor]
            return(
              <div key={i} className={`flex-1 ${col.bg} p-2 text-center ${i<arr.length-1?'border-r border-white':''}`}>
                <div className="text-sm">{ic}</div>
                <div className={`text-lg font-semibold ${col.text}`}>{n}</div>
                <div className={`text-[9px] ${col.text}`}>{l}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 mb-2">📅 May 2026</p>
          <div className="grid grid-cols-7 gap-px">
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d=><div key={d} className="text-center text-[9px] text-gray-300">{d}</div>)}
            {Array.from({length:4}).map((_,i)=><div key={i}/>)}
            {Array.from({length:31},(_,i)=>i+1).map(day=>(
              <div key={day} className={`text-center text-[10px] rounded cursor-pointer py-0.5 ${day===11?'bg-blue-100 text-blue-700 font-medium':'text-gray-700 hover:bg-gray-50'}`}>
                {day}
                {CALENDAR_EVENTS[day]&&day!==11&&<div className={`w-1 h-1 rounded-full mx-auto ${STATUS_COLORS[CALENDAR_EVENTS[day] as StatusColor].dot}`}/>}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
            {[['teal','Today · Mei Lin: toile fitting'],['amber','May 15 · Priya: payment due'],['blue','May 22 · Team: Jakarta trip']].map(([c,l],i)=>(
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[c as StatusColor].dot}`}/>{l}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-2">📊 Revenue</p>
            <div className="grid grid-cols-2 gap-2">
              {[['Contracted','$62k',''],['Collected','$32.5k','text-emerald-600'],['Avg margin','38%',''],['Pipeline','$41k','text-amber-600']].map(([l,v,c],i)=>(
                <div key={i} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[9px] text-gray-400">{l}</p>
                  <p className={`text-sm font-semibold text-gray-800 ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-2">⏱ Payment aging</p>
            {[['Priya Sharma','$7,000','14d overdue','text-red-600'],['Mei Lin Tan','$5,000','Due Jun 15','text-amber-600'],['Sofia Chen','$3,500','On track','text-emerald-600']].map(([n,a,s,c],i)=>(
              <div key={i} className="flex items-center text-xs py-1 border-b border-gray-50 last:border-0">
                <span className="flex-1 text-[11px] text-gray-700">{n}</span>
                <span className="text-[11px] font-medium mr-2">{a}</span>
                <span className={`text-[10px] ${c}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 mb-2">⚡ Activity feed</p>
          {ACTIVITY_FEED.map(item=>{
            const colors={design:'blue',payment:'amber',alert:'red',prospect:'teal',logistics:'coral',milestone:'green'} as Record<string,StatusColor>
            const c=STATUS_COLORS[colors[item.type]??'blue']
            return(
              <div key={item.id} className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 text-[10px]`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-700 truncate">{item.text}</p>
                  <p className="text-[9px] text-gray-400">{item.time}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-2">💬 Comms gaps</p>
            {COMMS_GAPS.map((c,i)=>(
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <Avatar initials={c.initials} color={c.statusColor} size="sm"/>
                <div className="flex-1"><p className="text-[11px] font-medium">{c.bride}</p></div>
                <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{c.daysAgo}</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 mb-2">📦 Logistics</p>
            {LOGISTICS.map(l=>(
              <div key={l.id} className="py-1.5 border-b border-gray-50 last:border-0">
                <p className="text-[11px] font-medium">{l.bride}: {l.item}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${l.status==='delivered'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>
                  {l.status==='delivered'?'✓ Delivered':`In transit · ETA ${l.eta}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <p className="text-[10px] text-gray-400 mb-2">✈️ Team travel</p>
        <div className="grid grid-cols-3 gap-2">
          {TEAM_TRAVEL.map((t,i)=>(
            <div key={i} className="border border-gray-100 rounded-lg p-2">
              <p className="text-[9px] text-gray-400">{t.dates}</p>
              <p className="text-xs font-medium">{t.city}</p>
              <p className="text-[10px] text-gray-400">{t.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProspectsView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold">Prospects</h1>
          <p className="text-[11px] text-gray-400">● Auto-captured from WhatsApp Business</p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">⚡ AI extraction active</span>
      </div>
      {PROSPECTS.map(p=>{
        const s=getProspectStatusConfig(p.status)
        return(
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-medium">{p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-medium">{p.name}</span><Badge label={s.label} color={s.color}/></div>
                <p className="text-[10px] text-gray-400">{p.phone} · {p.receivedAt}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 italic mb-3">"{p.rawMessage}"</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[['📍',p.location],['📅',p.weddingDate],['💰',p.budget]].map(([ic,v],i)=>(
                <span key={i} className="flex items-center gap-1 text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{ic} {v}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button className="text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Reply on WA</button>
              <button className="text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Book brief call</button>
              <button className="ml-auto text-[11px] px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50">Convert to bride →</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BridesList({onSelect}:{onSelect:(id:number)=>void}) {
  return(
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold">Brides</h1>
        <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">+ Add bride</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {BRIDES.map(b=>(
          <button key={b.id} onClick={()=>onSelect(b.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
            <Avatar initials={b.initials} color={b.statusColor}/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{b.name}</p>
              <p className="text-[10px] text-gray-400">{b.location} · {b.weddingDate}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <Badge label={b.status} color={b.statusColor}/>
              <p className="text-[10px] text-gray-400 mt-1">{b.paymentPercent}% paid</p>
            </div>
            <span className="text-gray-300">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BrideDetail({id,onBack,tab,setTab}:{id:number;onBack:()=>void;tab:string;setTab:(t:string)=>void}) {
  const b=BRIDES.find(x=>x.id===id)!
  const tabs=['brief','timeline','design','payments','notes']
  return(
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">← Brides</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{b.name}</span>
        <span className="ml-auto"><Badge label={b.status} color={b.statusColor}/></span>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4 pb-3 border-b border-gray-100">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 text-xs rounded-lg border capitalize ${tab===t?'bg-gray-100 font-medium border-gray-200':'text-gray-400 border-gray-100 hover:bg-gray-50'}`}>{t==='notes'?'Internal notes':t}</button>
        ))}
      </div>
      {tab==='brief'&&<div>
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed mb-4">{b.brief}</div>
        <div className="grid grid-cols-2 gap-2">
          {[['Designer',b.designer],['Wedding',b.weddingDate],['Location',b.location]].map(([l,v],i)=>(
            <div key={i} className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">{l}</p><p className="text-xs font-medium">{v}</p></div>
          ))}
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] text-gray-400">Status</p><Badge label={b.status} color={b.statusColor}/></div>
        </div>
      </div>}
      {tab==='timeline'&&<div className="space-y-3">
        {b.timeline.map((s,i)=>(
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${s.done?'bg-emerald-500':s.overdue?'bg-red-500':s.current?'bg-amber-500':'bg-gray-200'}`}/>
              {i<b.timeline.length-1&&<div className="w-px flex-1 min-h-[20px] bg-gray-100 mt-1"/>}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-[10px] text-gray-400">{s.date}</p>
              <p className={`text-xs ${s.done?'text-gray-400 line-through':s.overdue?'text-red-700 font-medium':s.current?'font-medium':''}`}>{s.label}</p>
              {s.current&&!s.overdue&&<span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">Current</span>}
              {s.overdue&&<span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">⚠️ Overdue — email sent</span>}
            </div>
          </div>
        ))}
      </div>}
      {tab==='design'&&<div>
        {b.discussions.map((d,i)=>(
          <div key={i} className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-medium ${d.from==='Bride'?'text-blue-700':d.from==='Putri'?'text-teal-700':'text-amber-700'}`}>{d.from}</span>
              <span className="text-[9px] text-gray-300">{d.date}</span>
            </div>
            <div className={`rounded-xl px-3 py-2 text-xs text-gray-700 ${d.from==='Bride'?'bg-blue-50':'bg-gray-50'}`}>{d.text}</div>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex gap-2">
          <input type="text" placeholder="Add a note..." className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300"/>
          <button className="px-3 py-2 rounded-lg border border-gray-200 text-xs">Send</button>
        </div>
      </div>}
      {tab==='payments'&&<div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[['Contract',formatCurrency(b.total),''],['Collected',formatCurrency(b.paid),'text-emerald-600'],['Outstanding',formatCurrency(b.total-b.paid),'text-red-500']].map(([l,v,c],i)=>(
            <div key={i} className="bg-gray-50 rounded-lg p-2.5"><p className="text-[9px] text-gray-400">{l}</p><p className={`text-sm font-semibold ${c}`}>{v}</p></div>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded-full mb-3 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${b.paymentPercent}%`}}/></div>
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 px-3 py-2 text-[10px] text-gray-400 gap-2"><span>Milestone</span><span>Amount</span><span>Status</span></div>
          {[['Deposit (25%)',b.total*.25,b.paymentPercent>=25],['2nd (25%)',b.total*.25,b.paymentPercent>=50],['3rd (25%)',b.total*.25,b.paymentPercent>=75],['Final (25%)',b.total*.25,b.paymentPercent>=100]].map(([m,a,paid],i)=>(
            <div key={i} className="grid grid-cols-3 px-3 py-2.5 text-xs border-t border-gray-50 gap-2">
              <span>{m as string}</span><span className="font-medium">{formatCurrency(a as number)}</span>
              <span className={paid?'text-emerald-600':'text-gray-400'}>{paid?'✓ Paid':'Pending'}</span>
            </div>
          ))}
        </div>
      </div>}
      {tab==='notes'&&<div>
        <div className="text-xs text-gray-400 mb-3">🔒 Roéma + Designer only</div>
        {[['KYC profile',b.kyc],['Gatekeeper',b.gatekeeper]].map(([t,v],i)=>(
          <div key={i} className="bg-gray-50 rounded-xl p-3 mb-3">
            <p className="text-[10px] font-semibold text-gray-500 mb-1">{t}</p>
            <p className="text-xs text-gray-700">{v}</p>
          </div>
        ))}
        <textarea placeholder="Add internal note..." rows={3} className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none resize-none"/>
        <button className="mt-2 text-[11px] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white">Save</button>
      </div>}
    </div>
  )
}

function Books() {
  const totals=BRIDES.reduce((a,b)=>({total:a.total+b.total,paid:a.paid+b.paid}),{total:0,paid:0})
  const avg=Math.round(BRIDES.reduce((a,b)=>a+b.margin,0)/BRIDES.length)
  return(
    <div>
      <div className="flex items-center justify-between mb-4"><h1 className="text-base font-semibold">Books</h1><span className="text-[10px] text-gray-400">🔒 Admin only</span></div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['Total contracted',formatCurrency(totals.total),''],['Collected',formatCurrency(totals.paid),'text-emerald-600'],['Avg margin',`${avg}%`,'']].map(([l,v,c],i)=>(
          <div key={i} className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">{l}</p><p className={`text-xl font-semibold ${c}`}>{v}</p></div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-[10px] text-gray-400 gap-2"><span className="col-span-2">Bride</span><span>Contract</span><span>Paid</span><span>Margin</span></div>
        {BRIDES.map(b=>(
          <div key={b.id} className="grid grid-cols-5 items-center px-4 py-3 border-t border-gray-50 gap-2">
            <div className="col-span-2 flex items-center gap-2"><Avatar initials={b.initials} color={b.statusColor} size="sm"/><span className="text-xs">{b.name.split(' ')[0]}</span></div>
            <span className="text-xs">{formatCurrency(b.total)}</span>
            <span className="text-xs text-emerald-600">{formatCurrency(b.paid)}</span>
            <span className="text-xs">{b.margin}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Team() {
  return(
    <div className="space-y-4">
      <h1 className="text-base font-semibold">Team & settings</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium mb-3">Members</p>
        {[{n:'You (Admin)',e:'hi@roemaatelier.com',r:'Roéma admin',i:'RA',c:'amber'},{n:'Putri Rahayu',e:'putri@designer.id',r:'Designer',i:'PR',c:'teal'}].map((m,i)=>(
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <Avatar initials={m.i} color={m.c as StatusColor}/>
            <div className="flex-1"><p className="text-xs font-medium">{m.n}</p><p className="text-[10px] text-gray-400">{m.e}</p></div>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{m.r}</span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium mb-3">Invite member</p>
        <div className="flex gap-2">
          <input type="email" placeholder="Email address" className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none"/>
          <select className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white"><option>Roéma admin</option><option>Designer</option></select>
          <button className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Invite</button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium mb-3">🔔 Notification rules</p>
        {[['Payment reminder','Email + WA to bride','7,3,1 days before','green'],['Milestone overdue','Email to PIC','Same day','red'],['Comms gap','Email to Roéma','5 days silence','amber'],['New WA prospect','Email to Roéma','Instant','teal'],['Logistics update','Email to bride + Roéma','Courier webhook','blue']].map(([t,r,w,c],i)=>{
          const col=STATUS_COLORS[c as StatusColor]
          return(
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${col.dot}`}/>
              <div className="flex-1"><p className="text-xs font-medium">{t}</p><p className="text-[10px] text-gray-400">{r} · {w}</p></div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>● active</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DesignerView() {
  return(
    <div>
      <div className="flex items-start justify-between mb-4">
        <div><h1 className="text-base font-semibold">Good morning, Putri</h1><p className="text-[11px] text-gray-400">Designer portal</p></div>
        <span className="text-[10px] bg-red-50 text-red-700 px-2.5 py-1 rounded-full">✉️ {OVERDUE_ITEMS.length} alerts received</span>
      </div>
      {OVERDUE_ITEMS.length>0&&(
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-red-800 mb-2">⚠️ Needs attention</p>
          {OVERDUE_ITEMS.map((item,i)=><div key={i} className="flex items-center gap-2 text-xs py-0.5 text-red-700"><Badge label={item.bride} color={item.statusColor}/>{item.item} — {item.daysOverdue}d overdue</div>)}
        </div>
      )}
      <div className="bg-amber-50 border-l-2 border-amber-400 rounded-r-xl p-3 mb-4">
        <p className="text-[10px] text-amber-600 mb-1">🔔 Today</p>
        <p className="text-sm font-medium">Mei Lin Tan — Toile fitting (May 11)</p>
        <p className="text-xs text-gray-500">Ensure toile is ready before session.</p>
      </div>
      <div className="space-y-3">
        {BRIDES.map(b=>{
          const next=b.timeline.find(t=>!t.done)
          const last=b.discussions[b.discussions.length-1]
          return(
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Avatar initials={b.initials} color={b.statusColor}/><div><p className="text-sm font-medium">{b.name}</p><p className="text-[10px] text-gray-400">{b.weddingDate}</p></div></div>
                <Badge label={b.status} color={b.statusColor}/>
              </div>
              <p className="text-[10px] text-gray-400">Next</p>
              <p className="text-xs font-medium mb-2">{next?.label??'Done'} <span className="font-normal text-gray-400">· {next?.date}</span></p>
              <div className="border-t border-gray-100 pt-2 text-xs text-gray-500">{last.from}: "{last.text.slice(0,60)}..."</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BridePortal({tab,setTab}:{tab:string;setTab:(t:string)=>void}) {
  const b=BRIDES[0]
  return(
    <div>
      <div className="border-b border-gray-100 pb-3 mb-4">
        <h1 className="text-base font-semibold">Hello, {b.name.split(' ')[0]} 👋</h1>
        <p className="text-[11px] text-gray-400">Roéma Atelier · {b.weddingDate}</p>
      </div>
      <div className="bg-amber-50 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"/>
        <div><p className="text-xs font-medium">Current: {b.status}</p><p className="text-[10px] text-gray-500">Next: Fabric sign-off · Jun 15</p></div>
      </div>
      <div className="flex gap-1.5 mb-4 pb-3 border-b border-gray-100">
        {['timeline','design','payments'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 text-xs rounded-lg border capitalize ${tab===t?'bg-gray-100 font-medium border-gray-200':'text-gray-400 border-gray-100 hover:bg-gray-50'}`}>
            {t==='timeline'?'My timeline':t==='design'?'Design board':'Payments'}
          </button>
        ))}
      </div>
      {tab==='timeline'&&<div className="space-y-3">
        {b.timeline.map((s,i)=>(
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${s.done?'bg-emerald-500':s.current?'bg-amber-400':'bg-gray-200'}`}/>
              {i<b.timeline.length-1&&<div className="w-px flex-1 min-h-[20px] bg-gray-100 mt-1"/>}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-[10px] text-gray-400">{s.date}</p>
              <p className={`text-xs ${s.done?'text-gray-400 line-through':s.current?'font-medium':''}`}>{s.label}</p>
              {s.current&&<span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">We are here ✨</span>}
            </div>
          </div>
        ))}
      </div>}
      {tab==='design'&&<div>
        {b.discussions.map((d,i)=>(
          <div key={i} className="mb-3">
            <div className="flex items-center gap-1.5 mb-1"><span className="text-xs font-medium">{d.from}</span><span className="text-[9px] text-gray-300">{d.date}</span></div>
            <div className={`rounded-xl px-3 py-2 text-xs ${d.from==='Bride'?'bg-blue-50':'bg-gray-50'}`}>{d.text}</div>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex gap-2 mt-3">
          <input type="text" placeholder="Message Roéma..." className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none"/>
          <button className="px-3 py-2 rounded-lg border border-gray-200 text-xs">Send</button>
        </div>
      </div>}
      {tab==='payments'&&<div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">Total</p><p className="text-lg font-semibold">{formatCurrency(b.total)}</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-[9px] text-gray-400">Outstanding</p><p className="text-lg font-semibold text-red-500">{formatCurrency(b.total-b.paid)}</p></div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${b.paymentPercent}%`}}/></div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-amber-700 mb-1">Next payment</p>
          <p className="text-lg font-semibold text-red-500">{formatCurrency(b.total*0.25)}</p>
          <p className="text-[10px] text-gray-500">Due Jun 15 · Fabric sign-off</p>
          <p className="text-[10px] text-gray-400 mt-1">🔔 Reminder sent 7, 3, and 1 day before</p>
        </div>
      </div>}
    </div>
  )
}
