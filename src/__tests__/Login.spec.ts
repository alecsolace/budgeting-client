import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import Login from '../views/Login.vue'

const vuetify = createVuetify({ components, directives })

describe('Login', () => {
  it('mounts without error', () => {
    const wrapper = mount(Login, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders "Sign in" heading', () => {
    const wrapper = mount(Login, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.text()).toContain('Sign in')
  })
})
