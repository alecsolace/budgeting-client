import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../plugins/supabase'
import { sanitizeRedirect } from '../utils/redirect'
import { useCommittedExpensesStore } from './committedExpenses'

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

  // `redirect` is whatever the router guard put in ?redirect= on /login
  // (untrusted — a caller could hand this straight from route.query).
  // Sanitize it here rather than trust the caller, and only append it when
  // it's not the default '/', so callback URLs stay short in the common case.
  async function signIn(email: string, redirect?: unknown): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase()
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin
    const target = sanitizeRedirect(redirect)
    // Always include a query string. The hosted Supabase email templates append
    // the one-time token hash to this URL for the PKCE-safe callback flow.
    const callbackUrl = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(target)}`

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: callbackUrl,
      },
    })

    if (error) {
      throw error
    }
  }

  /**
   * Completes the token-hash flow sent by the hosted Auth email templates.
   * `verifyOtp` both confirms a new address and creates the local session, so
   * the first link a person receives is also their sign-in link.
   */
  async function verifyMagicLink(tokenHash: string): Promise<void> {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    })

    if (error) {
      throw error
    }

    // onAuthStateChange normally makes this assignment. Keep the state in
    // sync here too so the router can immediately admit the destination.
    session.value = data.session
    user.value = data.session?.user ?? null
  }

  async function signOut(): Promise<void> {
    // Explicit user-initiated logout: revoke refresh tokens everywhere.
    await supabase.auth.signOut({ scope: 'global' })
    session.value = null
    user.value = null

    // Drop the previous user's committed-expenses cache so the onboarding
    // check re-runs for whoever signs in next.
    useCommittedExpensesStore().reset()
  }

  return {
    session,
    user,
    isAuthenticated,
    initialize,
    signIn,
    verifyMagicLink,
    signOut,
  }
})
