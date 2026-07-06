import Link from 'next/link'
import type { Item } from '@/types'

const STATUS: Record<string, { cls: string; label: string }> = {
  available: { cls: 'badge-green', label: '✓ Available' },
  borrowed:  { cls: 'badge-amber', label: '⏳ Borrowed' },
  reserved:  { cls: 'badge-blue',  label: '🔒 Reserved' },
}

export default function ItemCard({ item }: { item: Item }) {
  const s = STATUS[item.status] || { cls: 'badge-gray', label: item.status }
  const owner = item.owner as any

  return (
    <div className="card" style={{ transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
    >
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 188, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: 188, background: 'linear-gradient(135deg, #E1F5EE 0%, #9FE1CB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>📦</div>
      )}
      <div style={{ padding: '14px 14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>{item.title}</div>
          <span className={s.cls} style={{ flexShrink: 0 }}>{s.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
          <span className="tag">{item.category}</span>
          {owner && <span style={{ fontSize: 12, color: '#888' }}>· {owner.building}</span>}
        </div>
        {owner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 10px', background: '#fafafa', borderRadius: 8 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{owner.name?.slice(0,2).toUpperCase()}</div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{owner.name}</span>
              <span style={{ fontSize: 12, color: '#888' }}> · ⭐ {owner.karma} karma</span>
            </div>
          </div>
        )}
        <Link href={`/items/${item.id}`} className="btn-primary" style={{ padding: '10px 0', fontSize: 14 }}>
          View details →
        </Link>
      </div>
    </div>
  )
}
