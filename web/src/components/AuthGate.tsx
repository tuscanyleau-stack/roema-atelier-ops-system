'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'roema_admin' | 'designer' | 'bride'
  bride_id: string | null
}

export default function AuthGate({ children }: { children: (profile: Profile) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setProfile(null); setLoading(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { setProfile(data as Profile); setLoading(false) })
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!session) return <LoginScreen />

  if (!profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <p className="text-sm font-medium text-gray-800 mb-2">Account pending setup</p>
          <p className="text-xs text-gray-500 mb-4">
            Your login works, but no role has been assigned yet. Ask a Roéma admin to set your access level.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <>{children(profile)}</>
}

function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true); setMsg('')
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } },
      })
      setMsg(error ? error.message : 'Account created. Ask a Roéma admin to assign your role.')
    }
    setBusy(false)
  }

  const input = 'w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300'

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Roéma <span className="italic text-amber-600">Atelier</span></h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">Operations System</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex gap-1 mb-5 p-1 bg-gray-50 rounded-lg">
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg('') }}
                className={`flex-1 text-xs py-2 rounded-md transition-colors ${mode === m ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'}`}>
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-[10px] text-gray-400 block mb-1.5">Full name</label>
                <input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1.5">Email</label>
              <input type="email" className={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@roemaatelier.com" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1.5">Password</label>
              <input type="password" className={input} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} placeholder="••••••••" />
            </div>
          </div>

          {msg && <p className={`text-xs mt-3 ${msg.includes('created') ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>}

          <button onClick={submit} disabled={busy || !email || !password}
            className="w-full mt-5 text-sm py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 transition-colors">
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-4">
          Access is granted by a Roéma administrator
        </p>
      </div>
    </div>
  )
}
