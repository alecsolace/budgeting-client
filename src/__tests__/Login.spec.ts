import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { vuetify } from './helpers/vuetify'
import Login from '../views/Login.vue'

describe('Login', () => {
  it('mounts without error', () => {
    const wrapper = mount(Login, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the "Sign in" heading', () => {
    const wrapper = mount(Login, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.text()).toContain('Sign in')
  })

  it('applies the login CSS class to the container', () => {
    const wrapper = mount(Login, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.find('.login').exists()).toBe(true)
  })
})
