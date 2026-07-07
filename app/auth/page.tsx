'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORIES } from '@/types'

function AuthForm() {
  const params = useSearchParams()
  const [tab, setTab] = useState<'login'|'register'>(params.get('tab') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ name:'', email:'', password:'', building:'' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async () => {
    setError(''); setInfo(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const handleRegister = async () => {
    setError(''); setInfo(''); setLoading(true)
    if (!form.name || !form.email || !form.password || !form.building) {
      setError('Please fill in all fields'); setLoading(false); return
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
    // Clear any existing session first — otherwise, if email confirmation is
    // required, signUp won't establish a new session and the previous
    // account (e.g. a demo login) would stay active and land on /dashboard.
    await supabase.auth.signOut()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, building: form.building } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    // The public.users row is created server-side by a database trigger
    // (see supabase/schema.sql) so it works even before email confirmation.
    if (!data.session) {
      setLoading(false)
      setTab('login')
      setForm(f => ({ ...f, password: '' }))
      setInfo('✅ Account created! Check your email to confirm your account, then log in.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'white' }}>
      <div style={{ background: 'linear-gradient(160deg, #E1F5EE 0%, #9FE1CB 100%)', padding: '40px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#085041', letterSpacing: '-0.02em' }}>
          Share<span style={{ color: '#1D9E75' }}>Hood</span>
        </div>
        <div style={{ fontSize: 14, color: '#0F6E56', marginTop: 4 }}>Your neighborhood sharing platform</div>
      </div>

      <div style={{ padding: '28px 24px' }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f4f4f4', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setInfo('') }} style={{
              flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#1D9E75' : '#888',
              fontWeight: tab === t ? 700 : 500, fontSize: 15,
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s'
            }}>
              {t === 'login' ? '🔑 Log in' : '✨ Register'}
            </button>
          ))}
        </div>

        {error && <div className="error-box" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
        {info && <div style={{ background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB', borderRadius: 10, padding: '12px 14px', fontSize: 14, marginBottom: 16 }}>{info}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <div>
              <label className="form-label">Full name</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Yael Cohen" />
            </div>
          )}
          <div>
            <label className="form-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
          </div>
          {tab === 'register' && (
            <div>
              <label className="form-label">Building / Address</label>
              <input className="input" value={form.building} onChange={set('building')} placeholder="18 Dizengoff St, Building A" />
            </div>
          )}

          <button className="btn-primary" onClick={tab === 'login' ? handleLogin : handleRegister} disabled={loading} style={{ marginTop: 4, fontSize: 16 }}>
            {loading ? '⏳ Please wait...' : tab === 'login' ? 'Log in →' : 'Create account →'}
          </button>
        </div>

        {tab === 'login' && (
          <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
              🧪 Demo accounts for testing
            </div>
            {[['demo@sharehood.app', 'demo1234'], ['neighbor@sharehood.app', 'demo1234']].map(([e, p]) => (
              <div key={e} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: 13, color: '#555' }}>
                  <span style={{ fontWeight: 600 }}>{e}</span>
                  <span style={{ color: '#999' }}> / {p}</span>
                </div>
                <button onClick={() => { setForm(f => ({ ...f, email: e, password: p })) }} style={{ fontSize: 12, padding: '4px 10px', background: '#E1F5EE', color: '#0F6E56', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Fill
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
          {tab === 'login' ? (
            <>Don't have an account? <button onClick={() => setTab('register')} style={{ color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Register free</button></>
          ) : (
            <>Already have an account? <button onClick={() => setTab('login')} style={{ color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Log in</button></>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return <Suspense fallback={<div className="loading-screen"><div className="spinner"/></div>}><AuthForm /></Suspense>
}
