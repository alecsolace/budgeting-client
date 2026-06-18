import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isAuthenticated defaults to true in dev/test environment', () => {
    const store = useAuthStore()
    // import.meta.env.DEV is true in vitest — same as dev builds
    expect(store.isAuthenticated).toBe(true)
  })

  it('user defaults to null', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
  })

  it('user can be set to an object with id and email', () => {
    const store = useAuthStore()
    store.user = { id: 'abc-123', email: 'test@example.com' }
    expect(store.user).toEqual({ id: 'abc-123', email: 'test@example.com' })
  })

  it('isAuthenticated can be toggled', () => {
    const store = useAuthStore()
    store.isAuthenticated = false
    expect(store.isAuthenticated).toBe(false)
    store.isAuthenticated = true
    expect(store.isAuthenticated).toBe(true)
  })
})
