import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { vuetify } from './helpers/vuetify'
import WeeklyLog from '../views/WeeklyLog.vue'

describe('WeeklyLog', () => {
  it('mounts without error', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
