import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

vi.mock('../services/committedExpenses', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/committedExpenses')>()),
  listCommittedExpenses: vi.fn(),
  createCommittedExpense: vi.fn(),
  updateCommittedExpense: vi.fn(),
  deleteCommittedExpense: vi.fn(),
}))

import SettingsCommitted from '../views/SettingsCommitted.vue'
import CommittedExpenseRow from '../components/CommittedExpenseRow.vue'
import {
  listCommittedExpenses,
  createCommittedExpense,
  deleteCommittedExpense,
  updateCommittedExpense,
  type CommittedExpense,
} from '../services/committedExpenses'

const vuetify = createVuetify({ components, directives })
const listMock = vi.mocked(listCommittedExpenses)
const createMock = vi.mocked(createCommittedExpense)
const deleteMock = vi.mocked(deleteCommittedExpense)
const updateMock = vi.mocked(updateCommittedExpense)

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function expense(overrides: Partial<CommittedExpense> = {}): CommittedExpense {
  return {
    id: 'exp-1',
    name: 'Rent',
    amount: 1200,
    currency: 'USD',
    frequency: 'monthly',
    category: 'housing',
    active: true,
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  listMock.mockReset().mockResolvedValue([])
  createMock.mockReset()
  deleteMock.mockReset().mockResolvedValue()
  updateMock.mockReset().mockResolvedValue(expense())
})

async function mountSettings() {
  const wrapper = mount(SettingsCommitted, {
    global: { plugins: [vuetify], stubs: { RouterLink: true } },
  })
  await flushPromises()
  return wrapper
}

describe('SettingsCommitted', () => {
  it('loads active committed expenses on mount, one row each', async () => {
    listMock.mockResolvedValue([expense({ id: 'a' }), expense({ id: 'b', name: 'Gym' })])

    const wrapper = await mountSettings()

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.findAllComponents(CommittedExpenseRow)).toHaveLength(2)
  })

  it('deletes a row: calls DELETE and removes it from the DOM immediately', async () => {
    listMock.mockResolvedValue([expense({ id: 'exp-1' })])

    const wrapper = await mountSettings()
    expect(wrapper.findAllComponents(CommittedExpenseRow)).toHaveLength(1)

    wrapper.findComponent(CommittedExpenseRow).vm.$emit('delete')
    await flushPromises()

    expect(deleteMock).toHaveBeenCalledWith('exp-1')
    expect(wrapper.findAllComponents(CommittedExpenseRow)).toHaveLength(0)
    expect(wrapper.text()).toContain('No committed expenses. Add one above.')
  })

  it('adds a row and POSTs it when the name is blurred with a value', async () => {
    createMock.mockResolvedValue(expense({ id: 'new-1', name: 'Gym', amount: 40 }))

    const wrapper = await mountSettings()
    await wrapper.get('.settings-committed__add').trigger('click')

    const row = wrapper.findComponent(CommittedExpenseRow)
    row.vm.$emit('update:modelValue', {
      name: 'Gym',
      amount: 40,
      frequency: 'monthly',
      category: 'other',
    })
    await flushPromises()
    row.vm.$emit('blur')
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gym', amount: 40 }))
    expect(wrapper.findAllComponents(CommittedExpenseRow)).toHaveLength(1)
  })

  it('does not POST a newly added row that is blurred while still empty', async () => {
    const wrapper = await mountSettings()
    await wrapper.get('.settings-committed__add').trigger('click')

    wrapper.findComponent(CommittedExpenseRow).vm.$emit('blur')
    await flushPromises()

    expect(createMock).not.toHaveBeenCalled()
  })

  it('saves an existing edit when tab moves from the name field to amount', async () => {
    listMock.mockResolvedValue([expense({ id: 'exp-1', name: 'Rent' })])
    const wrapper = await mountSettings()
    const row = wrapper.findComponent(CommittedExpenseRow)

    row.vm.$emit('update:modelValue', {
      name: 'Utilities',
      amount: 1200,
      frequency: 'monthly',
      category: 'housing',
    })
    await flushPromises()

    const nameInput = row.get('.committed-row__name input')
    const amountInput = row.get('.committed-row__amount-field input')
    nameInput.element.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: amountInput.element }),
    )
    await flushPromises()

    expect(updateMock).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ name: 'Utilities' }),
    )
  })

  it('does not duplicate a new expense when multiple blur events occur during its POST', async () => {
    let resolveCreate: (value: CommittedExpense) => void = () => undefined
    createMock.mockImplementationOnce(
      () =>
        new Promise<CommittedExpense>((resolve) => {
          resolveCreate = resolve
        }),
    )

    const wrapper = await mountSettings()
    await wrapper.get('.settings-committed__add').trigger('click')
    const row = wrapper.findComponent(CommittedExpenseRow)
    row.vm.$emit('update:modelValue', {
      name: 'Gym',
      amount: 40,
      frequency: 'monthly',
      category: 'other',
    })
    await flushPromises()

    row.vm.$emit('blur')
    row.vm.$emit('blur')
    expect(createMock).toHaveBeenCalledTimes(1)

    resolveCreate(expense({ id: 'new-1', name: 'Gym', amount: 40 }))
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(1)
  })
})
