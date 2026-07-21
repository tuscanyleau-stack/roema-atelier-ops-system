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

  if (loading) return <Curtain />
  if (!session) return <LoginScreen />
  if (!profile) return <PendingScreen />

  return <>{children(profile)}</>
}

/* ---------------------------------------------------------------- */

function Seam() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="anim-seam h-full w-px" style={{ background: 'var(--line)' }} />
    </div>
  )
}

function Notch({ position }: { position: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden
      className={`anim-rule d4 absolute left-1/2 h-px w-7 -translate-x-1/2 ${position === 'top' ? '-top-px' : '-bottom-px'}`}
      style={{ background: 'var(--ink)' }}
    />
  )
}

function Curtain() {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--paper)' }}>
      <Seam />
      <div className="relative flex min-h-screen items-center justify-center">
        <p className="anim-settle text-xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.3em' }}>
          Roéma
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!email || !password) return
    setBusy(true); setMsg(''); setIsError(false)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMsg(error.message); setIsError(true) }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } },
      })
      if (error) { setMsg(error.message); setIsError(true) }
      else { setMsg('Account created. A Roéma admin will set your access.'); setIsError(false) }
    }
    setBusy(false)
  }

  const field =
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none transition-shadow ' +
    'focus:border-[color:var(--chalk)] focus:shadow-[0_0_0_3px_rgba(91,110,140,0.14)]'

  const labelCls = 'mb-1.5 block text-[10px] uppercase'
  const labelStyle = { color: 'var(--muted)', letterSpacing: '0.16em' }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <Seam />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">

          {/* Masthead */}
          <div className="mb-9 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/roema-logo.png"
              alt="Roéma"
              className="anim-rise d1 mx-auto w-[168px] select-none"
              draggable={false}
            />
            <div className="anim-rule d2 mx-auto mt-6 h-px w-14" style={{ background: 'var(--ink)' }} />
            <h1
              className="anim-rise d3 mt-6 text-[34px] italic leading-none"
              style={{ fontWeight: 300, letterSpacing: '-0.02em' }}
            >
              Welcome home
            </h1>
            <p
              className="anim-rise d4 mt-3 text-[10px] uppercase"
              style={{ color: 'var(--muted)', letterSpacing: '0.28em' }}
            >
              Atelier Operations
            </p>
          </div>

          {/* Card */}
          <div
            className="anim-rise d5 relative rounded-2xl border p-7"
            style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
          >
            <Notch position="top" />
            <Notch position="bottom" />

            <div className="mb-6 flex gap-6 border-b" style={{ borderColor: 'var(--line)' }}>
              {([['signin', 'Sign in'], ['signup', 'Create account']] as const).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setMsg('') }}
                  className="-mb-px border-b pb-2.5 text-[13px]"
                  style={{
                    borderColor: mode === m ? 'var(--ink)' : 'transparent',
                    color: mode === m ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className={labelCls} style={labelStyle}>Full name</label>
                  <input
                    className={field}
                    style={{ borderColor: 'var(--line)' }}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="How you sign your work"
                  />
                </div>
              )}

              <div>
                <label className={labelCls} style={labelStyle}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  className={field}
                  style={{ borderColor: 'var(--line)' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@roemaatelier.com"
                />
              </div>

              <div>
                <label className={labelCls} style={labelStyle}>Password</label>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={field}
                  style={{ borderColor: 'var(--line)' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {msg && (
              <p className="mt-4 text-[12px] leading-relaxed" style={{ color: isError ? 'var(--thread)' : 'var(--chalk)' }}>
                {msg}
              </p>
            )}

            <button
              onClick={submit}
              disabled={busy || !email || !password}
              className="mt-6 w-full rounded-lg py-3 text-[14px] text-white hover:opacity-90 disabled:opacity-30"
              style={{ background: 'var(--ink)' }}
            >
              {busy ? 'One moment' : mode === 'signin' ? 'Enter the atelier' : 'Create account'}
            </button>
          </div>

          <p className="anim-settle d5 mt-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
            Access is granted by a Roéma administrator
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

function PendingScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <Seam />
      <div className="relative flex min-h-screen items-center justify-center px-5">
        <div
          className="anim-rise relative w-full max-w-[380px] rounded-2xl border p-8 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
        >
          <Notch position="top" />
          <Notch position="bottom" />
          <p className="text-[22px] italic" style={{ fontWeight: 300 }}>Almost there</p>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Your account is active, but no role has been set yet. A Roéma admin
            decides what you can see — ask them to finish the setup.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-6 rounded-lg border px-5 py-2 text-[13px]"
            style={{ borderColor: 'var(--line)' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
