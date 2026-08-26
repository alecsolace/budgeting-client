import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { isRef } from 'vue'

vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))

import { authMock, fakeSession, resetSupabaseMock } from './mocks/supabase'
import { useAuth } from '../composables/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    resetSupabaseMock()
    setActivePinia(createPinia())
  })

  it('exposes store state as refs, not one-off snapshots', () => {
    const { session, user, isAuthenticated } = useAuth()

    expect(isRef(session)).toBe(true)
    expect(isRef(user)).toBe(true)
    expect(isRef(isAuthenticated)).toBe(true)
  })

  it('starts signed out', () => {
    const { user, isAuthenticated } = useAuth()

    expect(isAuthenticated.value).toBe(false)
    expect(user.value).toBeNull()
  })

  it('stays reactive as the store changes', async () => {
    const session = fakeSession()
    authMock.getSession.mockResolvedValue({ data: { session }, error: null })

    const { user, isAuthenticated, initialize } = useAuth()
    expect(isAuthenticated.value).toBe(false)

    await initialize()

    expect(isAuthenticated.value).toBe(true)
    expect(user.value).toEqual(session.user)
  })

  it('forwards the store actions', () => {
    const { signIn, signOut, initialize } = useAuth()

    expect(typeof signIn).toBe('function')
    expect(typeof signOut).toBe('function')
    expect(typeof initialize).toBe('function')
  })
})
