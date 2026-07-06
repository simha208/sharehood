import Link from 'next/link'

const FEATURES = [
  { icon: '🔍', title: 'Browse items', desc: 'Find what you need in your building' },
  { icon: '📬', title: 'Request & approve', desc: 'Simple borrow request flow' },
  { icon: '💬', title: 'Chat directly', desc: 'Message neighbors in-app' },
  { icon: '⭐', title: 'Karma system', desc: 'Build trust with every share' },
]

export default function Home() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'white' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #E1F5EE 0%, #9FE1CB 100%)', padding: '64px 24px 40px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(29,158,117,0.3)' }}>
          <span style={{ fontSize: 36 }}>🏘️</span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#085041', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Share<span style={{ color: '#1D9E75' }}>Hood</span>
        </h1>
        <p style={{ fontSize: 17, color: '#0F6E56', margin: '0 0 20px', fontWeight: 500 }}>
          Borrow. Share. Connect.
        </p>
        <p style={{ fontSize: 15, color: '#085041', maxWidth: 300, margin: '0 auto', lineHeight: 1.7 }}>
          Share everyday items with your building neighbors — for free, safely, and with trust.
        </p>
      </div>

      <div style={{ padding: '32px 24px 48px' }}>
        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#fafafa', borderRadius: 12, padding: '16px 14px', border: '1px solid #eee' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/auth" className="btn-primary" style={{ fontSize: 16 }}>Get started →</Link>
          <Link href="/auth?tab=login" className="btn-secondary">Already have an account? Log in</Link>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
          {[['500+', 'Items shared'], ['120+', 'Neighbors'], ['4.9★', 'Avg rating']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1D9E75' }}>{n}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
