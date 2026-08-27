import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))

import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { authMock, resetSupabaseMock } from './mocks/supabase'
// The real Vuetify instance, so the Lune themes (and their contrast fixes) are
// the thing under test rather than a stand-in.
import vuetify from '../plugins/vuetify'
import Login from '../views/Login.vue'

function mountLogin() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: Login },
    ],
  })

  return mount(Login, { global: { plugins: [vuetify, pinia, router] } })
}

// Separate from mountLogin() so the other ~dozen tests above don't have to
// become async just to accommodate the router.push() this one needs before
// Login.vue reads route.query.redirect.
async function mountLoginAt(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: Login },
    ],
  })

  await router.push(path)
  return mount(Login, { global: { plugins: [vuetify, pinia, router] } })
}

async function submitWith(wrapper: VueWrapper, address: string) {
  const input = wrapper.find('input[name="email"]')
  await input.setValue(address)
  await input.trigger('blur')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('Login', () => {
  beforeEach(() => {
    resetSupabaseMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the idle state copy', () => {
    const wrapper = mountLogin()

    expect(wrapper.text()).toContain('Good to see you.')
    expect(wrapper.text()).toContain("We'll send you a link — no password needed.")
    expect(wrapper.text()).toContain('Send my link')
  })

  it('labels the field properly instead of using the placeholder', () => {
    const wrapper = mountLogin()
    const label = wrapper.find('label[for="login-email"]')

    expect(label.exists()).toBe(true)
    expect(wrapper.find('input[name="email"]').attributes('id')).toBe('login-email')
  })

  it('sets the input attributes the browser needs', () => {
    const attributes = mountLogin().find('input[name="email"]').attributes()

    expect(attributes.type).toBe('email')
    expect(attributes.autocomplete).toBe('email')
    expect(attributes.inputmode).toBe('email')
    expect(attributes.spellcheck).toBe('false')
    expect(attributes.maxlength).toBe('254')
  })

  it('renders the CTA on the text-safe terracotta, not on `primary`', () => {
    const classes = mountLogin().find('button[type="submit"]').classes()

    expect(classes).toContain('bg-cta')
    expect(classes).not.toContain('bg-primary')
  })

  it('keeps the CTA disabled until a plausible address is present', async () => {
    const wrapper = mountLogin()
    const cta = () => wrapper.find('button[type="submit"]')

    expect(cta().attributes('disabled')).toBeDefined()

    await wrapper.find('input[name="email"]').setValue('sam@example.com')
    expect(cta().attributes('disabled')).toBeUndefined()
  })

  it('validates on blur, not per keystroke', async () => {
    const wrapper = mountLogin()
    const input = wrapper.find('input[name="email"]')

    await input.setValue('sam@')
    expect(wrapper.text()).not.toContain("That doesn't look like an email address yet.")

    await input.trigger('blur')
    expect(wrapper.text()).toContain("That doesn't look like an email address yet.")
  })

  it('shows identical success copy whether or not the address has an account', async () => {
    const existing = mountLogin()
    await submitWith(existing, 'existing@example.com')
    const existingText = existing.text()

    resetSupabaseMock()

    const brandNew = mountLogin()
    await submitWith(brandNew, 'brand-new@example.com')
    const brandNewText = brandNew.text()

    expect(existingText).toContain('Check your inbox — the link is on its way.')
    // Byte-identical: any divergence here is a user-enumeration oracle.
    expect(brandNewText).toBe(existingText)
  })

  it('embeds ?redirect= from the URL into the magic-link callback', async () => {
    const wrapper = await mountLoginAt('/login?redirect=%2Fsummary%2F2026-08-24')
    await submitWith(wrapper, 'sam@example.com')

    expect(authMock.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('redirect=%2Fsummary%2F2026-08-24'),
        }),
      }),
    )
  })

  it('replaces the form entirely once the link is sent', async () => {
    const wrapper = mountLogin()
    await submitWith(wrapper, 'sam@example.com')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Good to see you.')
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('shows a generic error and never the provider message', async () => {
    authMock.signInWithOtp.mockResolvedValue({
      data: {},
      error: Object.assign(new Error('User not found: no row in auth.users'), { status: 400 }),
    })

    const wrapper = mountLogin()
    await submitWith(wrapper, 'sam@example.com')

    expect(wrapper.text()).toContain('Something went wrong — try again?')
    expect(wrapper.text()).not.toContain('auth.users')
    expect(wrapper.text()).not.toContain('User not found')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('wires the error text to the input with aria-describedby', async () => {
    authMock.signInWithOtp.mockResolvedValue({
      data: {},
      error: Object.assign(new Error('boom'), { status: 500 }),
    })

    const wrapper = mountLogin()
    await submitWith(wrapper, 'sam@example.com')

    expect(wrapper.find('input[name="email"]').attributes('aria-describedby')).toBe('login-error')
    expect(wrapper.find('#login-error').exists()).toBe(true)
  })

  it('drops into a 60s cooldown on a 429 instead of letting retries pile up', async () => {
    vi.useFakeTimers()
    authMock.signInWithOtp.mockResolvedValue({
      data: {},
      error: Object.assign(new Error('email rate limit exceeded'), { status: 429 }),
    })

    const wrapper = mountLogin()
    await submitWith(wrapper, 'sam@example.com')

    const cta = () => wrapper.find('button[type="submit"]')
    expect(cta().attributes('disabled')).toBeDefined()
    expect(cta().text()).toContain('Try again in 60s')

    await vi.advanceTimersByTimeAsync(1000)
    expect(cta().text()).toContain('Try again in 59s')

    await vi.advanceTimersByTimeAsync(59_000)
    expect(cta().text()).toContain('Send my link')
    expect(cta().attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })
})
