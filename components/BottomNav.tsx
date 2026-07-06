'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard', label: 'Home',
    icon: (a: boolean) => <svg fill={a?"#1D9E75":"none"} stroke={a?"#1D9E75":"#bbb"} strokeWidth={1.8} viewBox="0 0 24 24" width={22} height={22}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
  },
  {
    href: '/items/add', label: 'Add',
    icon: (a: boolean) => <svg fill="none" stroke={a?"#1D9E75":"#bbb"} strokeWidth={1.8} viewBox="0 0 24 24" width={22} height={22}><circle cx="12" cy="12" r="9" strokeLinecap="round"/><path strokeLinecap="round" d="M12 8v8M8 12h8"/></svg>
  },
  {
    href: '/messages', label: 'Chat',
    icon: (a: boolean) => <svg fill="none" stroke={a?"#1D9E75":"#bbb"} strokeWidth={1.8} viewBox="0 0 24 24" width={22} height={22}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
  },
  {
    href: '/my-items', label: 'My Items',
    icon: (a: boolean) => <svg fill="none" stroke={a?"#1D9E75":"#bbb"} strokeWidth={1.8} viewBox="0 0 24 24" width={22} height={22}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
  },
  {
    href: '/profile', label: 'Profile',
    icon: (a: boolean) => <svg fill="none" stroke={a?"#1D9E75":"#bbb"} strokeWidth={1.8} viewBox="0 0 24 24" width={22} height={22}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
  },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="bottom-nav">
      {NAV.map(item => {
        const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href} className={`nav-item${active ? ' active' : ''}`}>
            {item.icon(active)}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
