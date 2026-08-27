import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))

import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { authMock, fakeSession, resetSupabaseMock } from './mocks/supabase'
import AuthCallback from '../views/AuthCallback.vue'

const vuetify = createVuetify({ components, directives })
const blank = { template: '<div />' }

async function mountCallbackAt(query: string) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router: Router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: blank },
      { path: '/auth/callback', component: AuthCallback },
      { path: '/summary/:weekStart', component: blank },
    ],
  })

  await router.push(`/auth/callback${query}`)
  await router.isReady()

  const replaceSpy = vi.spyOn(router, 'replace')
  const pushSpy = vi.spyOn(router, 'push')
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

  const wrapper = mount(AuthCallback, { global: { plugins: [vuetify, pinia, router] } })
  await flushPromises()

  return { wrapper, replaceSpy, pushSpy, replaceStateSpy }
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetSupabaseMock()
    authMock.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null })
  })

  it('exchanges the code by awaiting initialize()', async () => {
    await mountCallbackAt('?code=one-time-code')

    expect(authMock.getSession).toHaveBeenCalledTimes(1)
  })

  it('verifies a token hash from the custom email template', async () => {
    await mountCallbackAt('?redirect=%2Fsummary%2F2026-08-24&token_hash=one-time-token&type=email')

    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'one-time-token',
      type: 'email',
    })
    expect(authMock.getSession).not.toHaveBeenCalled()
  })

  it('strips the query string from the URL and the back-stack', async () => {
    const { replaceStateSpy } = await mountCallbackAt(
      '?redirect=%2F&token_hash=one-time-token&type=email',
    )

    expect(replaceStateSpy).toHaveBeenCalled()
    // First call is ours, before any router navigation touches history.
    expect(replaceStateSpy.mock.calls[0][2]).toBe('/auth/callback')
    expect(String(replaceStateSpy.mock.calls[0][2])).not.toContain('token_hash=')
  })

  it('uses replace(), not push(), so the callback never enters history', async () => {
    const { replaceSpy, pushSpy } = await mountCallbackAt('?code=one-time-code')

    expect(replaceSpy).toHaveBeenCalledTimes(1)
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('honours a safe ?redirect= target', async () => {
    const { replaceSpy } = await mountCallbackAt(
      '?code=one-time-code&redirect=%2Fsummary%2F2026-08-24',
    )

    expect(replaceSpy).toHaveBeenCalledWith('/summary/2026-08-24')
  })

  it('refuses an off-site ?redirect= target', async () => {
    const { replaceSpy } = await mountCallbackAt(
      '?code=one-time-code&redirect=%2F%2Fevil.example.com',
    )

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('still leaves the callback route even if the exchange fails', async () => {
    authMock.getSession.mockRejectedValue(new Error('exchange failed'))

    const { replaceSpy } = await mountCallbackAt('?code=bad-code')

    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('shows a quiet placeholder while it works', async () => {
    const { wrapper } = await mountCallbackAt('?code=one-time-code')

    expect(wrapper.text()).toContain('Signing you in')
  })
})
