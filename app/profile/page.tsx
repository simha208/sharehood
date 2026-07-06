'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import type { User, BorrowRequest, Item } from '@/types'

const KARMA_LEVELS = [
  { min:100, label:'🏆 Legend',  color:'#854F0B', bg:'#FAEEDA' },
  { min:50,  label:'⭐ Trusted', color:'#0F6E56', bg:'#E1F5EE' },
  { min:20,  label:'👍 Good',    color:'#1D9E75', bg:'#E1F5EE' },
  { min:0,   label:'🌱 New',     color:'#666',    bg:'#f5f5f5' },
]

export default function Profile() {
  const [user, setUser] = useState<User|null>(null)
  const [myBorrows, setMyBorrows] = useState<(BorrowRequest & { item:Item })[]>([])
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const [{ data:u }, { count }, { data:borrows }] = await Promise.all([
        supabase.from('users').select('*').eq('id', session.user.id).single(),
        supabase.from('items').select('*', {count:'exact', head:true}).eq('owner_id', session.user.id),
        supabase.from('borrow_requests').select('*, item:items!item_id(*)').eq('borrower_id', session.user.id).order('created_at', {ascending:false})
      ])
      setUser(u); setItemCount(count||0); setMyBorrows((borrows||[]) as any)
      setLoading(false)
    }
    init()
  }, [])

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Loading…</span></div>

  const karma = user?.karma||0
  const level = KARMA_LEVELS.find(l => karma >= l.min) || KARMA_LEVELS[KARMA_LEVELS.length-1]
  const returnedCount = myBorrows.filter(b=>b.status==='returned').length
  const BORROW_BADGE: Record<string,string> = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red', returned:'badge-gray' }

  return (
    <div className="page-wrap">
      <div className="topbar">
        <div style={{ fontSize:18, fontWeight:800 }}>Profile</div>
        <button onClick={signOut} className="btn-ghost" style={{ color:'#e53e3e', fontSize:14 }}>Log out</button>
      </div>

      <div className="content">
        {/* Profile card */}
        <div style={{ background:'linear-gradient(135deg, #E1F5EE 0%, #9FE1CB 100%)', borderRadius:16, padding:'28px 20px 24px', textAlign:'center' }}>
          <div className="avatar" style={{ width:80, height:80, fontSize:30, margin:'0 auto 14px', background:'#1D9E75', color:'white', boxShadow:'0 4px 16px rgba(29,158,117,0.3)' }}>
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>{user?.name}</div>
          <div style={{ fontSize:14, color:'#555', marginBottom:16 }}>📍 {user?.building}</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:'white', padding:'12px 24px', borderRadius:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
            <div>
              <div style={{ fontSize:28, fontWeight:800, color:'#1D9E75', lineHeight:1 }}>{karma}</div>
              <div style={{ fontSize:12, color:'#888', marginTop:2 }}>Karma</div>
            </div>
            <div style={{ width:1, height:36, background:'#eee' }}/>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:level.color }}>{level.label}</div>
              <div style={{ fontSize:12, color:'#888' }}>Level</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-val">{itemCount}</div>
            <div className="stat-lbl">Items shared</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{myBorrows.length}</div>
            <div className="stat-lbl">Borrows</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{returnedCount}</div>
            <div className="stat-lbl">Returned</div>
          </div>
        </div>

        {/* Karma rules */}
        <div className="card" style={{ padding:16 }}>
          <div className="section-header" style={{ marginBottom:12 }}>Karma rules</div>
          {[['✅ Return on time','+10','#1D9E75'],['🤝 Successful lend','+5','#1D9E75'],['⏰ Late return','-10','#e53e3e']].map(([label,pts,color])=>(
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f5f5f5', fontSize:14, alignItems:'center' }}>
              <span style={{ color:'#444' }}>{label}</span>
              <span style={{ fontWeight:800, color, fontSize:15 }}>{pts}</span>
            </div>
          ))}
          <div style={{ fontSize:12, color:'#aaa', marginTop:10 }}>
            💡 The more you share and return on time, the higher your Karma!
          </div>
        </div>

        {/* Borrow history */}
        <div>
          <div className="section-header" style={{ marginBottom:10 }}>Borrow history</div>
          {myBorrows.length===0 ? (
            <div style={{ textAlign:'center', padding:'24px', color:'#bbb', fontSize:14 }}>
              No borrow history yet. Browse items to get started!
            </div>
          ) : myBorrows.map(req => (
            <div key={req.id} className="card" style={{ padding:'12px 14px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{(req.item as any)?.title}</div>
                <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{new Date(req.created_at).toLocaleDateString()}</div>
              </div>
              <span className={BORROW_BADGE[req.status]||'badge-gray'}>{req.status}</span>
            </div>
          ))}
        </div>

        <button onClick={signOut} className="btn-danger">🚪 Log out</button>
      </div>

      <BottomNav/>
    </div>
  )
}
