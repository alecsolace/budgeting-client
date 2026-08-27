import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const push = vi.fn()
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))

vi.mock('../services/committedExpenses', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/committedExpenses')>()),
  createCommittedExpense: vi.fn(),
}))

import Onboarding from '../views/Onboarding.vue'
import CommittedExpenseRow from '../components/CommittedExpenseRow.vue'
import { createCommittedExpense, type CommittedExpenseDraft } from '../services/committedExpenses'

const vuetify = createVuetify({ components, directives })
const createMock = vi.mocked(createCommittedExpense)

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  setActivePinia(createPinia())
  push.mockReset()
  createMock.mockReset()
  createMock.mockResolvedValue({
    id: 'srv-id',
    name: '',
    amount: 0,
    currency: 'USD',
    frequency: 'monthly',
    category: 'other',
    active: true,
  })
})

function mountOnboarding() {
  return mount(Onboarding, { global: { plugins: [vuetify] } })
}

function setRow(wrapper: ReturnType<typeof mountOnboarding>, index: number, draft: Partial<CommittedExpenseDraft>) {
  const rows = wrapper.findAllComponents(CommittedExpenseRow)
  rows[index].vm.$emit('update:modelValue', {
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: 'other',
    ...draft,
  })
}

describe('Onboarding', () => {
  it('renders three empty rows on mount', () => {
    expect(mountOnboarding().findAllComponents(CommittedExpenseRow)).toHaveLength(3)
  })

  it('on submit, skips empty rows and POSTs once per fully-filled row', async () => {
    const wrapper = mountOnboarding()

    setRow(wrapper, 0, { name: 'Rent', amount: 1200 })
    setRow(wrapper, 1, { name: 'Spotify', amount: 11.99 })
    // row 2 left empty
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rent', amount: 1200 }))
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Spotify', amount: 11.99 }))
    expect(push).toHaveBeenCalledWith('/')
  })

  it('blocks submission and flags the missing field when a row is half-filled', async () => {
    const wrapper = mountOnboarding()

    setRow(wrapper, 0, { name: 'Rent', amount: 0 })
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createMock).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.findAllComponents(CommittedExpenseRow)[0].props('invalidFields')).toContain('amount')
  })

  it('lets a user skip setup entirely — no rows, straight to the weekly log', async () => {
    const wrapper = mountOnboarding()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createMock).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/')
  })
})
