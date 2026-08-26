import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))

import { authMock, fakeSession, resetSupabaseMock } from './mocks/supabase'
// The real module, guard included — a locally re-implemented guard would test
// nothing that ships.
import router, { sanitizeRedirect } from '../plugins/router'

function signedIn() {
  authMock.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null })
}

describe('sanitizeRedirect', () => {
  it('accepts a same-origin path', () => {
    expect(sanitizeRedirect('/summary/2026-08-24')).toBe('/summary/2026-08-24')
  })

  it('rejects a protocol-relative target', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/')
  })

  it('rejects an absolute URL', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/')
  })

  it('rejects a backslash-disguised target', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBe('/')
  })

  it('rejects non-string input', () => {
    expect(sanitizeRedirect(undefined)).toBe('/')
    expect(sanitizeRedirect(['/a', '/b'])).toBe('/')
  })
})

describe('router guard', () => {
  beforeEach(() => {
    resetSupabaseMock()
    setActivePinia(createPinia())
  })

  it('holds a protected navigation until initialize() resolves', async () => {
    let release: (() => void) | undefined
    authMock.getSession.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ data: { session: fakeSession() }, error: null })
      }),
    )

    let settled = false
    const navigation = router.push('/onboarding').then(() => {
      settled = true
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(settled).toBe(false)

    release?.()
    await navigation

    expect(settled).toBe(true)
    expect(router.currentRoute.value.name).toBe('onboarding')
  })

  it('redirects an unauthenticated visitor to /login and remembers where they were going', async () => {
    await router.push('/summary/2026-08-24')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/summary/2026-08-24')
  })

  it('lets an authenticated visitor into a protected route', async () => {
    signedIn()
    await router.push('/settings/committed')

    expect(router.currentRoute.value.name).toBe('settings-committed')
  })

  it('sends an already-authenticated visitor away from /login', async () => {
    signedIn()
    await router.replace('/onboarding')

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('weekly-log')
  })

  it('lets an unauthenticated visitor reach /login', async () => {
    await router.replace('/')
    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('falls through to the 404 route for unknown paths', async () => {
    await router.push('/definitely-not-a-page')

    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
