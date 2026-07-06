'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import ItemCard from '@/components/ItemCard'
import type { Item, User } from '@/types'
import { CATEGORIES } from '@/types'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [filtered, setFiltered] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      setUser(u)
      const { data } = await supabase.from('items').select('*, owner:users!owner_id(*)').order('created_at', { ascending: false })
      setItems(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    let r = items
    if (activeCat !== 'All') r = r.filter(i => i.category === activeCat)
    if (search.trim()) r = r.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    setFiltered(r)
  }, [activeCat, search, items])

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"/>
      <span>Loading ShareHood…</span>
    </div>
  )

  const available = filtered.filter(i => i.status === 'available').length

  return (
    <div className="page-wrap">
      {/* Topbar */}
      <div className="topbar">
        <div className="logo">Share<span>Hood</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/messages')} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }} title="Messages">
            <svg fill="none" stroke="#666" strokeWidth={1.8} viewBox="0 0 24 24" width={22} height={22}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </button>
          <div className="avatar" style={{ width:36, height:36, fontSize:13, cursor:'pointer' }} onClick={() => router.push('/profile')}>
            {user?.name?.slice(0,2).toUpperCase()||'?'}
          </div>
        </div>
      </div>

      <div className="content">
        {/* Greeting */}
        <div style={{ padding:'4px 2px' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#1a1a1a' }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </div>
          <div style={{ fontSize:14, color:'#888', marginTop:2 }}>
            {available} item{available!==1?'s':''} available near you
          </div>
        </div>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search items…" style={{ paddingLeft:42 }} />
          <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}
            fill="none" stroke="#bbb" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
          </svg>
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#bbb', fontSize:18, lineHeight:1 }}>×</button>
          )}
        </div>

        {/* Category filters */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`cat-pill ${activeCat===cat ? 'cat-pill-active' : 'cat-pill-inactive'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>No items found</h3>
            <p>{search || activeCat !== 'All' ? 'Try a different search or category' : 'Be the first to add an item!'}</p>
            <button onClick={() => router.push('/items/add')} className="btn-primary" style={{ marginTop:16, width:'auto', padding:'10px 24px' }}>
              Add an item
            </button>
          </div>
        ) : (
          filtered.map(item => <ItemCard key={item.id} item={item} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
