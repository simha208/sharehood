'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthCtx {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, signOut: async () => {}, refreshUser: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUser = async (authId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', authId).single()
    setUser(data)
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await fetchUser(session.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await fetchUser(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) await fetchUser(session.user.id)
      else setUser(null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, signOut, refreshUser }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
