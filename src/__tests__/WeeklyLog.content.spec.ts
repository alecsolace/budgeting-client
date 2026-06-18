import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { vuetify } from './helpers/vuetify'
import WeeklyLog from '../views/WeeklyLog.vue'

describe('WeeklyLog content', () => {
  it('renders the "Weekly Log" heading', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.text()).toContain('Weekly Log')
  })

  it('renders the check-in subtitle copy', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.text()).toContain('Ready for your weekly check-in?')
  })

  it('applies the weekly-log CSS class to the container', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.find('.weekly-log').exists()).toBe(true)
  })

  it('applies Lune typography class text-week-title to the heading', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.find('h1.text-week-title').exists()).toBe(true)
  })

  it('applies muted color class to subtitle', () => {
    const wrapper = mount(WeeklyLog, {
      global: { plugins: [vuetify] },
    })
    expect(wrapper.find('p.text-muted-color').exists()).toBe(true)
  })
})
