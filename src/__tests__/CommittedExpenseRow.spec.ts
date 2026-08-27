import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import CommittedExpenseRow from '../components/CommittedExpenseRow.vue'
import type { CommittedExpenseDraft } from '../services/committedExpenses'

const vuetify = createVuetify({ components, directives })

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function draft(overrides: Partial<CommittedExpenseDraft> = {}): CommittedExpenseDraft {
  return { name: '', amount: 0, frequency: 'monthly', category: 'other', ...overrides }
}

function mountRow(props: Record<string, unknown> = {}) {
  return mount(CommittedExpenseRow, {
    props: { modelValue: draft(), ...props },
    global: { plugins: [vuetify] },
  })
}

describe('CommittedExpenseRow', () => {
  it('renders name, amount, frequency and category fields with the documented defaults', () => {
    const wrapper = mountRow()

    const selects = wrapper.findAllComponents({ name: 'VSelect' })

    expect(wrapper.find('.committed-row__name').exists()).toBe(true)
    expect(wrapper.find('.committed-row__amount-field').exists()).toBe(true)
    expect(selects).toHaveLength(2)
    expect(wrapper.html()).toContain('e.g. Rent')
    expect(wrapper.html()).toContain('0.00')

    // Defaults from issue #7: frequency = monthly, category = other.
    expect(selects[0].props('modelValue')).toBe('monthly')
    expect(selects[1].props('modelValue')).toBe('other')

    // Delete button is hidden unless the row is explicitly deletable (settings).
    expect(wrapper.findComponent({ name: 'VBtn' }).exists()).toBe(false)
  })

  it('shows the delete button only when deletable', () => {
    expect(mountRow({ deletable: true }).findComponent({ name: 'VBtn' }).exists()).toBe(true)
  })

  it('shows the weekly equivalent (amount ÷ 4.33) below the amount for a monthly expense', () => {
    const wrapper = mountRow({ modelValue: draft({ frequency: 'monthly', amount: 100 }) })

    // 100 / 4.33 = 23.094… → $23.09/wk
    expect(wrapper.get('.committed-row__weekly').text()).toBe('$23.09/wk')
  })

  it('does not show a weekly equivalent for non-monthly frequencies or a zero amount', () => {
    expect(mountRow({ modelValue: draft({ frequency: 'weekly', amount: 100 }) }).find('.committed-row__weekly').exists()).toBe(false)
    expect(mountRow({ modelValue: draft({ frequency: 'monthly', amount: 0 }) }).find('.committed-row__weekly').exists()).toBe(false)
  })
})
