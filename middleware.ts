import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/items/add', '/messages', '/my-items', '/profile']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Check for supabase auth cookie (any sb- prefixed cookie)
  const hasCookie = Array.from(request.cookies.getAll()).some(c => c.name.startsWith('sb-'))
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/items/add/:path*', '/messages/:path*', '/my-items/:path*', '/profile/:path*']
}
