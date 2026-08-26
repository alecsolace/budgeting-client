// Shared stand-in for @supabase/supabase-js. Nothing in the suite is allowed
// to touch a real network or a real project.
//
// Usage, from a spec in src/__tests__/:
//   vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))
import { vi } from 'vitest'

export type AuthStateCallback = (event: string, session: unknown) => void

export const authStateCallbacks: AuthStateCallback[] = []

export const authMock = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
}

export const createClient = vi.fn(() => ({ auth: authMock }))

/** Session shaped just enough for the store's `session !== null` check. */
export function fakeSession(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'user-1', email: 'sam@example.com' },
    ...overrides,
  }
}

/** Restores the default (signed-out) behaviour and clears recorded calls. */
export function resetSupabaseMock() {
  authStateCallbacks.length = 0

  authMock.getSession.mockReset()
  authMock.onAuthStateChange.mockReset()
  authMock.signInWithOtp.mockReset()
  authMock.signOut.mockReset()

  authMock.getSession.mockResolvedValue({ data: { session: null }, error: null })
  authMock.onAuthStateChange.mockImplementation((callback: AuthStateCallback) => {
    authStateCallbacks.push(callback)
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
  authMock.signInWithOtp.mockResolvedValue({ data: {}, error: null })
  authMock.signOut.mockResolvedValue({ error: null })
}

/** Drives the store's onAuthStateChange handler the way supabase-js would. */
export function emitAuthState(event: string, session: unknown) {
  authStateCallbacks.forEach((callback) => callback(event, session))
}

resetSupabaseMock()
