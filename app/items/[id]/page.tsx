'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import type { Item, User, BorrowRequest } from '@/types'

const STATUS_BADGE: Record<string,string> = { available:'badge-green', borrowed:'badge-amber', reserved:'badge-blue' }
const STATUS_LABEL: Record<string,string> = { available:'✓ Available', borrowed:'⏳ Borrowed', reserved:'🔒 Reserved' }

export default function ItemDetails() {
  const { id } = useParams()
  const [item, setItem] = useState<Item|null>(null)
  const [me, setMe] = useState<User|null>(null)
  const [myReq, setMyReq] = useState<BorrowRequest|null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const [{ data: u }, { data: i }] = await Promise.all([
        supabase.from('users').select('*').eq('id', session.user.id).single(),
        supabase.from('items').select('*, owner:users!owner_id(*)').eq('id', id).single()
      ])
      setMe(u); setItem(i)
      const { data: req } = await supabase.from('borrow_requests').select('*').eq('item_id', id).eq('borrower_id', session.user.id).order('created_at', { ascending: false }).limit(1).single()
      setMyReq(req)
      setLoading(false)
    }
    init()
  }, [id])

  // Reset cached per-user state when this page is hidden (Activity), so the
  // next signed-in user never sees a flash of the previous user's identity
  // or borrow-request status for this item.
  useLayoutEffect(() => {
    return () => {
      setMe(null)
      setMyReq(null)
      setLoading(true)
    }
  }, [])

  const requestBorrow = async () => {
    if (!me || !item) return
    setWorking(true)
    await supabase.from('borrow_requests').insert({ item_id: item.id, borrower_id: me.id, status: 'pending' })
    await supabase.from('items').update({ status: 'reserved' }).eq('id', item.id)
    const { data: req } = await supabase.from('borrow_requests').select('*').eq('item_id', item.id).eq('borrower_id', me.id).order('created_at', { ascending: false }).limit(1).single()
    setMyReq(req)
    setItem(p => p ? { ...p, status: 'reserved' } : p)
    showToast('✅ Borrow request sent!')
    setWorking(false)
  }

  const startChat = async () => {
    if (!me || !item) return
    const owner = item.owner as User
    await supabase.from('messages').insert({
      sender_id: me.id, receiver_id: owner.id,
      item_id: item.id,
      message: `Hi! I'm interested in borrowing your "${item.title}". Is it available?`
    })
    router.push(`/messages?with=${owner.id}`)
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Loading…</span></div>
  if (!item) return <div style={{ padding:24 }}>Item not found. <button onClick={() => router.push('/dashboard')} style={{ color:'#1D9E75', background:'none', border:'none', cursor:'pointer' }}>Go back</button></div>

  const owner = item.owner as User
  const isOwner = me?.id === item.owner_id

  return (
    <div className="page-wrap">
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:'#1D9E75', color:'white', padding:'10px 20px', borderRadius:20, fontSize:14, fontWeight:600, zIndex:100, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      <div className="topbar">
        <button className="btn-ghost" onClick={() => router.back()}>
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div style={{ fontSize:16, fontWeight:700 }}>Item details</div>
        <div style={{ width:60 }}/>
      </div>

      <div style={{ paddingBottom:90 }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} style={{ width:'100%', height:280, objectFit:'cover', display:'block' }}/>
        ) : (
          <div style={{ width:'100%', height:280, background:'linear-gradient(135deg,#E1F5EE,#9FE1CB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>📦</div>
        )}

        <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Title + status */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:10 }}>
              <h1 style={{ fontSize:24, fontWeight:800, lineHeight:1.2, margin:0 }}>{item.title}</h1>
              <span className={STATUS_BADGE[item.status]||'badge-gray'} style={{ flexShrink:0 }}>
                {STATUS_LABEL[item.status]||item.status}
              </span>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span className="tag">{item.category}</span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div style={{ background:'#fafafa', borderRadius:12, padding:'14px', border:'1px solid #eee' }}>
              <div className="section-header" style={{ marginBottom:6 }}>About this item</div>
              <p style={{ fontSize:15, color:'#444', lineHeight:1.7, margin:0 }}>{item.description}</p>
            </div>
          )}

          {/* Owner */}
          {owner && (
            <div className="card" style={{ padding:16 }}>
              <div className="section-header" style={{ marginBottom:10 }}>Owner</div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar" style={{ width:48, height:48, fontSize:18, background:'#1D9E75', color:'white' }}>
                  {owner.name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{owner.name}</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:2 }}>
                    📍 {owner.building}
                  </div>
                  <div style={{ fontSize:13, color:'#888' }}>
                    ⭐ {owner.karma} karma points
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isOwner && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {item.status === 'available' && !myReq && (
                <button className="btn-primary" onClick={requestBorrow} disabled={working} style={{ fontSize:16 }}>
                  {working ? '⏳ Sending request…' : '📬 Request to borrow'}
                </button>
              )}
              {myReq && (
                <div style={{
                  padding:'14px 16px', borderRadius:12, textAlign:'center', fontWeight:600, fontSize:15,
                  background: myReq.status==='approved' ? '#E1F5EE' : myReq.status==='rejected' ? '#fee2e2' : '#FAEEDA',
                  color: myReq.status==='approved' ? '#0F6E56' : myReq.status==='rejected' ? '#991b1b' : '#854F0B',
                  border: `1px solid ${myReq.status==='approved' ? '#9FE1CB' : myReq.status==='rejected' ? '#fca5a5' : '#FAC775'}`,
                }}>
                  {myReq.status==='pending' && '⏳ Request pending — waiting for owner'}
                  {myReq.status==='approved' && '✅ Request approved! You can pick it up'}
                  {myReq.status==='rejected' && '❌ Request was declined'}
                </div>
              )}
              {item.status === 'borrowed' && !myReq && (
                <div className="badge-amber" style={{ padding:'12px', textAlign:'center', borderRadius:10, fontSize:14 }}>
                  Currently borrowed by someone else
                </div>
              )}
              <button className="btn-secondary" onClick={startChat}>
                💬 Message the owner
              </button>
            </div>
          )}

          {isOwner && (
            <div style={{ background:'#E1F5EE', borderRadius:12, padding:'14px 16px', border:'1px solid #9FE1CB', textAlign:'center' }}>
              <div style={{ fontWeight:600, color:'#0F6E56', marginBottom:4 }}>This is your item</div>
              <button onClick={() => router.push('/my-items')} className="btn-secondary" style={{ marginTop:4 }}>
                Manage in My Items →
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav/>
    </div>
  )
}
