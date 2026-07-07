'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useLayoutEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import type { User, Message } from '@/types'

function MessagesInner() {
  const params = useSearchParams()
  const withId = params.get('with')
  const [me, setMe] = useState<User|null>(null)
  const [convos, setConvos] = useState<{user:User, lastMsg:string, itemTitle?:string}[]>([])
  const [activeUser, setActiveUser] = useState<User|null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list'|'chat'>('list')
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 80)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      setMe(u)

      const { data: msgs } = await supabase.from('messages')
        .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*), item:items!item_id(title)')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending:false })

      const seen = new Set<string>()
      const list: typeof convos = []
      for (const m of (msgs||[])) {
        const other: User = m.sender_id === session.user.id ? m.receiver : m.sender
        if (other && !seen.has(other.id)) {
          seen.add(other.id)
          list.push({ user:other, lastMsg:m.message, itemTitle:(m.item as any)?.title })
        }
      }
      setConvos(list)

      if (withId) {
        const { data: pu } = await supabase.from('users').select('*').eq('id', withId).single()
        if (pu) await openChat(pu, session.user.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Reset cached state when this page is hidden (Activity), so the next
  // signed-in user never sees a flash of the previous user's conversations.
  useLayoutEffect(() => {
    return () => {
      setMe(null)
      setConvos([])
      setActiveUser(null)
      setMessages([])
      setView('list')
      setLoading(true)
    }
  }, [])

  const openChat = async (other: User, myId?: string) => {
    const uid = myId || me?.id
    if (!uid) return
    setActiveUser(other)
    setView('chat')
    const { data } = await supabase.from('messages')
      .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${uid})`)
      .order('created_at', { ascending:true })
    setMessages(data||[])
    scrollBottom()
  }

  const send = async () => {
    if (!newMsg.trim() || !me || !activeUser) return
    const text = newMsg.trim()
    setNewMsg('')
    const { data } = await supabase.from('messages').insert({
      sender_id:me.id, receiver_id:activeUser.id, message:text
    }).select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)').single()
    if (data) setMessages(p => [...p, data as any])
    scrollBottom()
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Loading…</span></div>

  /* ── CHAT VIEW ── */
  if (view === 'chat' && activeUser) return (
    <div className="page-wrap" style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div className="topbar">
        <button className="btn-ghost" onClick={() => setView('list')}>
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="avatar" style={{ width:36, height:36, fontSize:13 }}>{activeUser.name?.slice(0,2).toUpperCase()}</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>{activeUser.name}</div>
            <div style={{ fontSize:11, color:'#1D9E75', fontWeight:600 }}>● Online</div>
          </div>
        </div>
        <div style={{ width:60 }}/>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.length===0 && (
          <div style={{ textAlign:'center', color:'#bbb', fontSize:14, marginTop:40 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>👋</div>
            Start the conversation!
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={m.sender_id===me?.id ? 'msg-out' : 'msg-in'}>
            {m.message}
            <div style={{ fontSize:10, opacity:0.6, marginTop:4, textAlign: m.sender_id===me?.id ? 'right' : 'left' }}>
              {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:'10px 12px', borderTop:'1px solid #eee', display:'flex', gap:8, background:'white' }}>
        <input className="input" value={newMsg} onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
          placeholder="Type a message…" style={{ flex:1 }}/>
        <button onClick={send} disabled={!newMsg.trim()} style={{
          background: newMsg.trim() ? '#1D9E75' : '#eee', border:'none', borderRadius:10,
          width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
          cursor: newMsg.trim() ? 'pointer' : 'default', transition:'background 0.15s', flexShrink:0
        }}>
          <svg fill="none" stroke={newMsg.trim()?'white':'#bbb'} strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>
    </div>
  )

  /* ── LIST VIEW ── */
  return (
    <div className="page-wrap">
      <div className="topbar">
        <div style={{ fontSize:18, fontWeight:800 }}>Messages</div>
      </div>
      <div style={{ paddingBottom:80 }}>
        {convos.length===0 ? (
          <div className="empty-state">
            <div className="icon">💬</div>
            <h3>No messages yet</h3>
            <p>Browse items and tap "Message the owner" to start a conversation</p>
          </div>
        ) : convos.map(c => (
          <button key={c.user.id} onClick={() => openChat(c.user)} style={{
            display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
            borderBottom:'1px solid #f5f5f5', cursor:'pointer', background:'white',
            width:'100%', border:'none', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#f5f5f5',
            textAlign:'left'
          }}>
            <div className="avatar" style={{ width:48, height:48, fontSize:16, background:'#E1F5EE' }}>
              {c.user.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'#1a1a1a' }}>{c.user.name}</div>
              {c.itemTitle && <div style={{ fontSize:12, color:'#1D9E75', marginBottom:2, fontWeight:500 }}>re: {c.itemTitle}</div>}
              <div style={{ fontSize:13, color:'#999', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.lastMsg}</div>
            </div>
            <svg fill="none" stroke="#ccc" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        ))}
      </div>
      <BottomNav/>
    </div>
  )
}

export default function MessagesPage() {
  return <Suspense fallback={<div className="loading-screen"><div className="spinner"/></div>}><MessagesInner/></Suspense>
}
