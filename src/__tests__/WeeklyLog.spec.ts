import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import WeeklyLog from '../views/WeeklyLog.vue'

const vuetify = createVuetify({ components, directives })

describe('WeeklyLog', () => {
  function mountWeeklyLog() {
    return mount(WeeklyLog, {
      global: {
        plugins: [vuetify],
        stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
      },
    })
  }

  it('mounts without error', () => {
    const wrapper = mountWeeklyLog()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders "Weekly Log" heading', () => {
    const wrapper = mountWeeklyLog()
    expect(wrapper.text()).toContain('Weekly Log')
  })

  it('links the COMMITTED section to its settings page', () => {
    const wrapper = mountWeeklyLog()

    expect(wrapper.get('#committed-heading').text()).toBe('COMMITTED')
    expect(wrapper.get('a').attributes('href')).toBe('/settings/committed')
    expect(wrapper.text()).toContain('Edit ›')
  })
})
