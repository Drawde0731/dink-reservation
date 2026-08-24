// Admin auth hook — wraps Supabase Auth session for admin UI.
// enable_signup=false in Supabase; admins are invited via dashboard.

import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'

export interface AdminAuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

export function useAdminAuth(): AdminAuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading }
}
