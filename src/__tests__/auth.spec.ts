import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))

import { authMock, emitAuthState, fakeSession, resetSupabaseMock } from './mocks/supabase'
import { useAuthStore } from '../stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    resetSupabaseMock()
    setActivePinia(createPinia())
  })

  it('starts signed out', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
    expect(store.user).toBeNull()
  })

  it('reflects the session returned by initialize()', async () => {
    const session = fakeSession()
    authMock.getSession.mockResolvedValue({ data: { session }, error: null })

    const store = useAuthStore()
    await store.initialize()

    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(session.user)
  })

  it('invokes getSession() exactly once for concurrent initialize() calls', async () => {
    let release: (() => void) | undefined
    authMock.getSession.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ data: { session: fakeSession() }, error: null })
      }),
    )

    const store = useAuthStore()
    const calls = [store.initialize(), store.initialize(), store.initialize()]

    release?.()
    await Promise.all(calls)

    expect(authMock.getSession).toHaveBeenCalledTimes(1)
    expect(store.isAuthenticated).toBe(true)
  })

  it('does not re-fetch on a later initialize() call', async () => {
    const store = useAuthStore()
    await store.initialize()
    await store.initialize()

    expect(authMock.getSession).toHaveBeenCalledTimes(1)
  })

  it('updates state from onAuthStateChange', () => {
    const store = useAuthStore()
    const session = fakeSession()

    emitAuthState('SIGNED_IN', session)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(session.user)

    emitAuthState('SIGNED_OUT', null)
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('signIn normalizes the address and passes the callback redirect', async () => {
    const store = useAuthStore()
    await store.signIn('  SAM@Example.COM  ')

    expect(authMock.signInWithOtp).toHaveBeenCalledWith({
      email: 'sam@example.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'http://localhost:5173/auth/callback',
      },
    })
  })

  it('signIn rethrows the provider error so the view can classify it', async () => {
    const rateLimit = Object.assign(new Error('rate limited'), { status: 429 })
    authMock.signInWithOtp.mockResolvedValue({ data: {}, error: rateLimit })

    const store = useAuthStore()
    await expect(store.signIn('sam@example.com')).rejects.toBe(rateLimit)
  })

  it('signOut revokes globally and clears local state', async () => {
    authMock.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null })
    const store = useAuthStore()
    await store.initialize()

    await store.signOut()

    expect(authMock.signOut).toHaveBeenCalledWith({ scope: 'global' })
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })
})
