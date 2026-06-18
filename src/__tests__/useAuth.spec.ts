import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'

describe('useAuth composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns isAuthenticated ref from the auth store', () => {
    const { isAuthenticated } = useAuth()
    expect(isAuthenticated.value).toBe(true)
  })

  it('returns user ref from the auth store (null by default)', () => {
    const { user } = useAuth()
    expect(user.value).toBeNull()
  })

  it('reflects store changes to isAuthenticated reactively', () => {
    const store = useAuthStore()
    const { isAuthenticated } = useAuth()
    store.isAuthenticated = false
    expect(isAuthenticated.value).toBe(false)
  })

  it('reflects store changes to user reactively', () => {
    const store = useAuthStore()
    const { user } = useAuth()
    store.user = { id: 'u1', email: 'hello@example.com' }
    expect(user.value).toEqual({ id: 'u1', email: 'hello@example.com' })
  })
})
