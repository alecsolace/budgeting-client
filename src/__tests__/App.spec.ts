import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

const vuetify = createVuetify({ components, directives })
const pinia = createPinia()
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

describe('App', () => {
  it('initializes with luneLight theme', () => {
    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    })
    const vApp = wrapper.findComponent({ name: 'VApp' })
    expect(vApp.props('theme')).toBe('luneLight')
  })
})
