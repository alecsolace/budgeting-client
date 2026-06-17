import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import WeeklyLog from '../views/WeeklyLog.vue'

const vuetify = createVuetify({ components, directives })

describe('WeeklyLog', () => {
  it('mounts without error', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
