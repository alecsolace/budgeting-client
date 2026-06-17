import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with isAuthenticated = true (dev default)', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
  })

  it('initializes with user = null', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
  })
})
