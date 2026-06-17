import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '../composables/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes isAuthenticated from auth store', () => {
    const { isAuthenticated } = useAuth()
    expect(isAuthenticated).toBe(true)
  })

  it('exposes user from auth store', () => {
    const { user } = useAuth()
    expect(user).toBeNull()
  })
})
