import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../plugins/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => session.value !== null)

  let initPromise: Promise<void> | null = null

  // Assigns only — never awaits another supabase.auth.* call here.
  // Awaiting inside this callback risks deadlocking supabase-js's internal
  // auth lock (documented supabase-js pitfall).
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    user.value = newSession?.user ?? null
  })

  async function initialize(): Promise<void> {
    if (initPromise) {
      return initPromise
    }

    initPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
    })()

    return initPromise
  }

  async function signIn(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase()
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  }

  async function signOut(): Promise<void> {
    // Explicit user-initiated logout: revoke refresh tokens everywhere.
    await supabase.auth.signOut({ scope: 'global' })
    session.value = null
    user.value = null
  }

  return {
    session,
    user,
    isAuthenticated,
    initialize,
    signIn,
    signOut,
  }
})
