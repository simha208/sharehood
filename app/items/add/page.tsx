'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { CATEGORIES } from '@/types'

export default function AddItem() {
  const [form, setForm] = useState({ title:'', description:'', category:CATEGORIES[0] })
  const [imageFile, setImageFile] = useState<File|null>(null)
  const [preview, setPreview] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setImageFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const submit = async () => {
    if (!form.title.trim()) { setError('Please enter an item name'); return }
    setError(''); setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    let image_url = ''
    if (imageFile) {
      setUploadProgress(30)
      const ext = imageFile.name.split('.').pop()
      const path = `${session.user.id}/${Date.now()}.${ext}`
      const { data: uploaded, error: upErr } = await supabase.storage.from('items').upload(path, imageFile)
      if (upErr) { setError('Failed to upload image: ' + upErr.message); setLoading(false); return }
      setUploadProgress(70)
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('items').getPublicUrl(path)
        image_url = publicUrl
      }
    }

    setUploadProgress(90)
    const { error: err } = await supabase.from('items').insert({
      owner_id: session.user.id, title: form.title.trim(),
      description: form.description.trim(), category: form.category,
      image_url, status: 'available'
    })
    if (err) { setError(err.message); setLoading(false); return }
    setUploadProgress(100)
    router.push('/my-items')
  }

  return (
    <div className="page-wrap">
      <div className="topbar">
        <button className="btn-ghost" onClick={() => router.back()}>
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div style={{ fontSize:16, fontWeight:700 }}>Add new item</div>
        <div style={{ width:60 }}/>
      </div>

      <div className="content">
        <div style={{ fontSize:14, color:'#888', lineHeight:1.6 }}>
          Share an item with your building neighbors. It only takes a minute! 🎉
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        {/* Photo */}
        <div>
          <label className="form-label">Photo (optional)</label>
          <div className="photo-drop" onClick={() => fileRef.current?.click()}>
            {preview ? (
              <>
                <img src={preview} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <span style={{ fontSize:28 }}>📷</span>
                  <span style={{ color:'white', fontSize:13, fontWeight:600 }}>Change photo</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:40, marginBottom:10 }}>📷</div>
                <div style={{ fontWeight:600, color:'#333', fontSize:15 }}>Choose a photo</div>
                <div style={{ fontSize:13, color:'#aaa', marginTop:4 }}>Click to browse · Max 5MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
        </div>

        {/* Fields */}
        <div>
          <label className="form-label">Item name *</label>
          <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Bosch Drill PSR 12"/>
        </div>

        <div>
          <label className="form-label">Category</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea className="input" value={form.description} onChange={set('description') as any}
            placeholder="Describe the item: condition, what's included, any usage tips…" rows={4}/>
        </div>

        {/* Upload progress */}
        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <div>
            <div style={{ fontSize:13, color:'#666', marginBottom:6 }}>Uploading… {uploadProgress}%</div>
            <div style={{ height:6, background:'#eee', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'#1D9E75', width:`${uploadProgress}%`, transition:'width 0.3s', borderRadius:3 }}/>
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={loading} style={{ fontSize:16 }}>
          {loading ? '⏳ Posting item…' : '✅ Post item for free'}
        </button>
      </div>

      <BottomNav/>
    </div>
  )
}
