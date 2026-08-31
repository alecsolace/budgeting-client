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
  deleteCommittedExpense: vi.fn(),
}))

import Onboarding from '../views/Onboarding.vue'
import {
  createCommittedExpense,
  deleteCommittedExpense,
  type CommittedExpense,
} from '../services/committedExpenses'

const vuetify = createVuetify({ components, directives })
const createMock = vi.mocked(createCommittedExpense)
const deleteMock = vi.mocked(deleteCommittedExpense)

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function created(overrides: Partial<CommittedExpense> = {}): CommittedExpense {
  return {
    id: 'srv-1',
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
  push.mockReset()
  createMock.mockReset().mockResolvedValue(created())
  deleteMock.mockReset().mockResolvedValue()
})

function mountOnboarding() {
  return mount(Onboarding, { global: { plugins: [vuetify] } })
}

type Wrapper = ReturnType<typeof mountOnboarding>

/**
 * Enter one expense through the open line, the way a person does.
 * Deliberately goes through the DOM rather than component internals so this
 * keeps working if the entry line is restructured again.
 */
async function enter(wrapper: Wrapper, name: string, amount: string) {
  await wrapper.get('#onboarding-name').setValue(name)
  await wrapper.get('#onboarding-amount').setValue(amount)
  await wrapper.get('#onboarding-amount').trigger('blur')
  await flushPromises()
}

/** Press the terminal action by its accessible name, not by form shape. */
async function finishSetup(wrapper: Wrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

function chipNamed(wrapper: Wrapper, label: string) {
  const chip = wrapper
    .findAll('button')
    .find((button) => button.text().trim() === label)
  if (!chip) throw new Error(`no chip labelled "${label}"`)
  return chip
}

describe('Onboarding', () => {
  it('offers a way to start entering an expense with no prior interaction', () => {
    const wrapper = mountOnboarding()

    // Whatever the flow, arriving must not require a preceding step.
    expect(wrapper.find('#onboarding-name').exists()).toBe(true)
    expect(wrapper.find('#onboarding-amount').exists()).toBe(true)
  })

  it('creates one record per completed entry and skips what was left blank', async () => {
    const wrapper = mountOnboarding()

    await enter(wrapper, 'Rent', '1200')
    await enter(wrapper, 'Spotify', '11.99')
    // A third entry is started and abandoned — it must not be saved.
    await wrapper.get('#onboarding-name').setValue('')

    await finishSetup(wrapper)

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rent', amount: 1200 }))
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Spotify', amount: 11.99 }),
    )
    expect(push).toHaveBeenCalledWith('/')
  })

  it('blocks and explains when an amount was entered with no name', async () => {
    const wrapper = mountOnboarding()

    await wrapper.get('#onboarding-amount').setValue('40')
    await wrapper.get('#onboarding-amount').trigger('blur')
    await flushPromises()

    await finishSetup(wrapper)

    expect(createMock).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('What should we call this one?')
  })

  it('blocks finishing when a named expense is still missing its amount', async () => {
    const wrapper = mountOnboarding()

    await wrapper.get('#onboarding-name').setValue('Council tax')
    await finishSetup(wrapper)

    expect(createMock).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('How much is this one?')
  })

  it('lets a person skip setup entirely — that is an allowed outcome', async () => {
    const wrapper = mountOnboarding()

    await finishSetup(wrapper)

    expect(createMock).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/')
  })

  it('on a partial failure keeps what was entered and retries only the failed row', async () => {
    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    await enter(wrapper, 'Gym', '40')

    createMock.mockReset()
    createMock
      .mockResolvedValueOnce(created({ name: 'Rent' }))
      .mockRejectedValueOnce(new Error('offline'))

    await finishSetup(wrapper)

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(push).not.toHaveBeenCalled()
    // Nothing the person typed is discarded.
    expect(wrapper.text()).toContain('we kept what you entered')
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).toContain('Gym')

    createMock.mockResolvedValue(created({ name: 'Gym' }))
    await finishSetup(wrapper)

    // Three calls total: Rent is not sent a second time.
    expect(createMock).toHaveBeenCalledTimes(3)
    expect(createMock).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Gym' }))
    expect(push).toHaveBeenCalledWith('/')
  })

  it('retries every row when an entire save attempt fails', async () => {
    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    await enter(wrapper, 'Gym', '40')

    createMock.mockReset().mockRejectedValue(new Error('offline'))
    await finishSetup(wrapper)

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('we kept what you entered')

    createMock
      .mockResolvedValueOnce(created({ id: 'srv-rent', name: 'Rent' }))
      .mockResolvedValueOnce(created({ id: 'srv-gym', name: 'Gym' }))
    await finishSetup(wrapper)

    expect(createMock).toHaveBeenCalledTimes(4)
    expect(push).toHaveBeenCalledWith('/')
  })

  it('a preset chip fills the name and carries its category, so only the amount is typed', async () => {
    const wrapper = mountOnboarding()

    await chipNamed(wrapper, 'Netflix').trigger('click')
    await flushPromises()

    expect((wrapper.get('#onboarding-name').element as HTMLInputElement).value).toBe('Netflix')

    await wrapper.get('#onboarding-amount').setValue('11.99')
    await wrapper.get('#onboarding-amount').trigger('blur')
    await finishSetup(wrapper)

    // Category rides along from the preset. Left to choose it themselves,
    // people leave every row on "other" and the taxonomy collapses.
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Netflix', amount: 11.99, category: 'subscription' }),
    )
  })

  it('tapping a chip mid-entry banks what was already typed instead of discarding it', async () => {
    const wrapper = mountOnboarding()

    await wrapper.get('#onboarding-name').setValue('Council tax')
    await wrapper.get('#onboarding-amount').setValue('180')

    await chipNamed(wrapper, 'Rent').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Council tax')
    expect((wrapper.get('#onboarding-name').element as HTMLInputElement).value).toBe('Rent')
  })

  it('does not replace a partial custom expense when a preset is tapped', async () => {
    const wrapper = mountOnboarding()

    await wrapper.get('#onboarding-name').setValue('Council tax')
    await chipNamed(wrapper, 'Rent').trigger('click')
    await flushPromises()

    expect((wrapper.get('#onboarding-name').element as HTMLInputElement).value).toBe('Council tax')
    expect(wrapper.text()).toContain('How much is this one?')
  })

  it('can be completed with the keyboard alone', async () => {
    const wrapper = mountOnboarding()

    await wrapper.get('#onboarding-name').setValue('Rent')
    await wrapper.get('#onboarding-amount').setValue('1200')
    // Enter commits the line without reaching for a mouse.
    await wrapper.get('#onboarding-amount').trigger('keydown.enter')
    await flushPromises()

    expect(wrapper.text()).toContain('Rent')

    await finishSetup(wrapper)
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rent' }))
    expect(push).toHaveBeenCalledWith('/')
  })

  it('keeps the finish action reachable at every point, including before anything is entered', async () => {
    const wrapper = mountOnboarding()

    const cta = wrapper.get('button[type="submit"]')
    expect(cta.attributes('disabled')).toBeUndefined()
    expect(cta.text()).toContain('Skip for now')

    await enter(wrapper, 'Rent', '1200')
    expect(wrapper.get('button[type="submit"]').text()).toContain("That's everything")
  })

  it('shows a running weekly total once something is on the list', async () => {
    const wrapper = mountOnboarding()
    expect(wrapper.text()).not.toContain('a week so far')

    await enter(wrapper, 'Rent', '1200')

    // 1200 / 4.33 = 277.13…
    expect(wrapper.text()).toContain('$277.14 a week so far')
  })

  it('removes a settled row when asked, and stops counting it', async () => {
    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    expect(wrapper.text()).toContain('Rent')

    await wrapper.get('button[aria-label="Remove Rent"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('a week so far')
    await finishSetup(wrapper)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('deletes a row that already reached the server during a partial submission', async () => {
    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    await enter(wrapper, 'Gym', '40')

    createMock.mockReset()
    createMock
      .mockResolvedValueOnce(created({ id: 'srv-rent', name: 'Rent' }))
      .mockRejectedValueOnce(new Error('offline'))
    await finishSetup(wrapper)

    await wrapper.get('button[aria-label="Remove Rent"]').trigger('click')
    await flushPromises()

    expect(deleteMock).toHaveBeenCalledWith('srv-rent')
    expect(wrapper.find('button[aria-label="Remove Rent"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Gym')
  })

  it('keeps a persisted row when deletion fails and lets the person retry', async () => {
    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    await enter(wrapper, 'Gym', '40')

    createMock.mockReset()
    createMock
      .mockResolvedValueOnce(created({ id: 'srv-rent', name: 'Rent' }))
      .mockRejectedValueOnce(new Error('offline'))
    await finishSetup(wrapper)

    deleteMock.mockRejectedValueOnce(new Error('offline'))
    await wrapper.get('button[aria-label="Remove Rent"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('button[aria-label="Remove Rent"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("Couldn't remove Rent")

    deleteMock.mockResolvedValueOnce()
    await wrapper.get('button[aria-label="Remove Rent"]').trigger('click')
    await flushPromises()

    expect(deleteMock).toHaveBeenCalledTimes(2)
    expect(wrapper.find('button[aria-label="Remove Rent"]').exists()).toBe(false)
  })

  it('clears a stale partial-save error when the failed row is removed', async () => {
    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    await enter(wrapper, 'Gym', '40')

    createMock.mockReset()
    createMock
      .mockResolvedValueOnce(created({ id: 'srv-rent', name: 'Rent' }))
      .mockRejectedValueOnce(new Error('offline'))
    await finishSetup(wrapper)
    expect(wrapper.text()).toContain("Couldn't save everything")

    await wrapper.get('button[aria-label="Remove Gym"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain("Couldn't save everything")
    await finishSetup(wrapper)
    expect(createMock).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith('/')
  })

  it('locks every entry control while records are being saved', async () => {
    let resolveCreate: ((value: CommittedExpense) => void) | undefined
    createMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        }),
    )

    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')
    const finishing = wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('#onboarding-name').attributes('disabled')).toBeDefined()
    expect(wrapper.get('#onboarding-amount').attributes('disabled')).toBeDefined()
    expect(chipNamed(wrapper, 'Netflix').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="Remove Rent"]').attributes('disabled')).toBeDefined()

    resolveCreate?.(created())
    await finishing
    await flushPromises()

    expect(push).toHaveBeenCalledWith('/')
  })

  it('does not submit the same rows twice when finish is triggered rapidly', async () => {
    let resolveCreate: ((value: CommittedExpense) => void) | undefined
    createMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        }),
    )

    const wrapper = mountOnboarding()
    await enter(wrapper, 'Rent', '1200')

    const firstSubmit = wrapper.get('form').trigger('submit')
    await flushPromises()
    const secondSubmit = wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(1)

    resolveCreate?.(created())
    await Promise.all([firstSubmit, secondSubmit])
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/')
  })
})
