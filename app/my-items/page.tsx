'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import type { Item, BorrowRequest, User } from '@/types'

type RequestWithRelations = BorrowRequest & { borrower: User; item: Item }

export default function MyItems() {
  const [items, setItems] = useState<Item[]>([])
  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items'|'requests'>('items')
  const [toast, setToast] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''), 3000) }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const { data: myItems } = await supabase.from('items').select('*').eq('owner_id', session.user.id).order('created_at', { ascending:false })
      setItems(myItems||[])
      if ((myItems||[]).length > 0) {
        const { data: reqs } = await supabase.from('borrow_requests')
          .select('*, borrower:users!borrower_id(*), item:items!item_id(*)')
          .in('item_id', (myItems||[]).map(i=>i.id))
          .order('created_at', { ascending:false })
        setRequests((reqs||[]) as any)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleRequest = async (req: RequestWithRelations, action: 'approved'|'rejected') => {
    await supabase.from('borrow_requests').update({ status:action }).eq('id', req.id)
    if (action === 'approved') {
      await supabase.from('items').update({ status:'borrowed' }).eq('id', req.item_id)
      await supabase.from('users').update({ karma: (req.borrower.karma||0)+5 }).eq('id', req.borrower_id)
      setItems(p => p.map(i => i.id===req.item_id ? {...i, status:'borrowed'} : i))
      showToast('✅ Request approved! +5 karma for borrower')
    } else {
      await supabase.from('items').update({ status:'available' }).eq('id', req.item_id)
      showToast('Request declined')
    }
    setRequests(p => p.map(r => r.id===req.id ? {...r, status:action} : r))
  }

  const markReturned = async (req: RequestWithRelations) => {
    await supabase.from('borrow_requests').update({ status:'returned' }).eq('id', req.id)
    await supabase.from('items').update({ status:'available' }).eq('id', req.item_id)
    await supabase.from('users').update({ karma: (req.borrower.karma||0)+10 }).eq('id', req.borrower_id)
    setRequests(p => p.map(r => r.id===req.id ? {...r, status:'returned'} : r))
    setItems(p => p.map(i => i.id===req.item_id ? {...i, status:'available'} : i))
    showToast('✅ Returned! +10 karma for borrower')
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return
    await supabase.from('items').delete().eq('id', itemId)
    setItems(p => p.filter(i=>i.id!==itemId))
    showToast('Item deleted')
  }

  const BADGE: Record<string,string> = { available:'badge-green', borrowed:'badge-amber', reserved:'badge-blue' }
  const REQ_BADGE: Record<string,string> = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red', returned:'badge-gray' }
  const pendingCount = requests.filter(r=>r.status==='pending').length

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Loading…</span></div>

  return (
    <div className="page-wrap">
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:'#1D9E75', color:'white', padding:'10px 20px', borderRadius:20, fontSize:14, fontWeight:600, zIndex:100, boxShadow:'0 4px 16px rgba(0,0,0,0.15)', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      <div className="topbar">
        <div style={{ fontSize:18, fontWeight:800 }}>My Items</div>
        <button onClick={() => router.push('/items/add')} style={{ background:'#1D9E75', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          + Add
        </button>
      </div>

      <div className="tab-bar">
        {[{k:'items',l:`My Items (${items.length})`},{k:'requests',l:`Requests${pendingCount>0?' ('+pendingCount+')':''}`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={`tab-btn${tab===t.k?' active':''}`}>{t.l}</button>
        ))}
      </div>

      <div className="content">
        {tab==='items' && (
          items.length===0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>No items yet</h3>
              <p>Share something with your neighbors and start building karma!</p>
              <button onClick={()=>router.push('/items/add')} className="btn-primary" style={{marginTop:16, width:'auto', padding:'10px 28px'}}>Add your first item</button>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="card">
              <div style={{ display:'flex', gap:12, padding:14 }}>
                {item.image_url ? (
                  <img src={item.image_url} style={{ width:72, height:72, objectFit:'cover', borderRadius:10, flexShrink:0 }}/>
                ) : (
                  <div style={{ width:72, height:72, background:'#E1F5EE', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>📦</div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{item.title}</div>
                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                    <span className="tag">{item.category}</span>
                    <span className={BADGE[item.status]||'badge-gray'}>{item.status}</span>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button onClick={() => deleteItem(item.id)} style={{ fontSize:12, padding:'5px 10px', border:'1px solid #fca5a5', borderRadius:6, cursor:'pointer', background:'#fee2e2', color:'#991b1b', fontWeight:500 }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {tab==='requests' && (
          requests.length===0 ? (
            <div className="empty-state">
              <div className="icon">📬</div>
              <h3>No requests yet</h3>
              <p>When neighbors request to borrow your items, they'll appear here</p>
            </div>
          ) : requests.map(req => (
            <div key={req.id} className="card" style={{ padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div className="avatar" style={{ width:44, height:44, fontSize:15, background:'#E1F5EE' }}>
                  {req.borrower?.name?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{req.borrower?.name}</div>
                  <div style={{ fontSize:13, color:'#666' }}>
                    wants to borrow <strong>{req.item?.title}</strong>
                  </div>
                  <div style={{ fontSize:12, color:'#bbb', marginTop:2 }}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={REQ_BADGE[req.status]||'badge-gray'}>{req.status}</span>
              </div>

              {req.status==='pending' && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>handleRequest(req,'approved')} className="btn-primary" style={{ flex:1, padding:10, fontSize:14, marginTop:0 }}>✅ Approve</button>
                  <button onClick={()=>handleRequest(req,'rejected')} className="btn-danger" style={{ flex:1, padding:10, fontSize:14, marginTop:0 }}>❌ Decline</button>
                </div>
              )}
              {req.status==='approved' && (
                <button onClick={()=>markReturned(req)} className="btn-secondary" style={{ fontSize:14, marginTop:0 }}>
                  📦 Mark as returned (+10 karma)
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav/>
    </div>
  )
}
