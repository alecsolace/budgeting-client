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
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { authMock, fakeSession, resetSupabaseMock } from './mocks/supabase'
import App from '../App.vue'

const vuetify = createVuetify({ components, directives })

type SchemeListener = (event: MediaQueryListEvent) => void

/** jsdom has no colour-scheme media support, so drive one by hand. */
function stubColorScheme(prefersDark: boolean) {
  const listeners: SchemeListener[] = []

  const query = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: SchemeListener) => {
      listeners.push(listener)
    },
    removeEventListener: (_type: string, listener: SchemeListener) => {
      const index = listeners.indexOf(listener)
      if (index !== -1) listeners.splice(index, 1)
    },
    addListener: (listener: SchemeListener) => {
      listeners.push(listener)
    },
    removeListener: (listener: SchemeListener) => {
      const index = listeners.indexOf(listener)
      if (index !== -1) listeners.splice(index, 1)
    },
    dispatchEvent: () => true,
    emit(next: boolean) {
      query.matches = next
      listeners.slice().forEach((listener) => listener({ matches: next } as MediaQueryListEvent))
    },
  }

  window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia

  return query
}

function mountApp() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div class="stub-home" />' } },
      { path: '/login', component: { template: '<div class="stub-login" />' } },
    ],
  })

  return { wrapper: mount(App, { global: { plugins: [vuetify, pinia, router] } }), router }
}

describe('App', () => {
  beforeEach(() => {
    resetSupabaseMock()
    stubColorScheme(false)
  })

  it('follows a light colour-scheme preference', async () => {
    const { wrapper } = mountApp()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'VApp' }).props('theme')).toBe('luneLight')
  })

  it('follows a dark colour-scheme preference', async () => {
    stubColorScheme(true)
    const { wrapper } = mountApp()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'VApp' }).props('theme')).toBe('luneDark')
  })

  it('reacts when the OS preference changes at runtime', async () => {
    const query = stubColorScheme(false)
    const { wrapper } = mountApp()
    await flushPromises()

    query.emit(true)
    await flushPromises()

    expect(wrapper.findComponent({ name: 'VApp' }).props('theme')).toBe('luneDark')
  })

  it('shows a linen placeholder instead of the router view until initialize() resolves', async () => {
    let release: (() => void) | undefined
    authMock.getSession.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ data: { session: null }, error: null })
      }),
    )

    const { wrapper } = mountApp()
    await flushPromises()

    expect(wrapper.find('.lune-boot').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(false)

    release?.()
    await flushPromises()

    expect(wrapper.find('.lune-boot').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })

  it('offers no sign-out affordance when signed out', async () => {
    const { wrapper } = mountApp()
    await flushPromises()

    expect(wrapper.find('.lune-account').exists()).toBe(false)
  })

  it('offers a sign-out affordance when signed in, and it signs out', async () => {
    authMock.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null })

    const { wrapper, router } = mountApp()
    await flushPromises()

    const signOut = wrapper.find('.lune-account button')
    expect(signOut.exists()).toBe(true)

    await signOut.trigger('click')
    await flushPromises()

    expect(authMock.signOut).toHaveBeenCalledWith({ scope: 'global' })
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
