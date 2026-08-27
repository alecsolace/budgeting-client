import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Fully replaced (no importOriginal): the store only needs listCommittedExpenses,
// and severing the service module here keeps its api/router import chain — and
// the router→store cycle — out of this unit test entirely.
vi.mock('../services/committedExpenses', () => ({
  listCommittedExpenses: vi.fn(),
}))

import { listCommittedExpenses } from '../services/committedExpenses'
import { useCommittedExpensesStore } from '../stores/committedExpenses'

const listMock = vi.mocked(listCommittedExpenses)

beforeEach(() => {
  setActivePinia(createPinia())
  listMock.mockReset()
})

describe('committedExpenses store — onboarding decision', () => {
  it('shouldOnboard is true once for a user with no committed expenses, then false (once per session)', async () => {
    listMock.mockResolvedValue([])
    const store = useCommittedExpensesStore()

    expect(await store.shouldOnboard()).toBe(true)
    expect(await store.shouldOnboard()).toBe(false)
    // The list endpoint is hit exactly once.
    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('shouldOnboard is false for a returning user with at least one expense', async () => {
    listMock.mockResolvedValue([
      {
        id: 'a',
        name: 'Rent',
        amount: 1200,
        currency: 'USD',
        frequency: 'monthly',
        category: 'housing',
        active: true,
      },
    ])
    const store = useCommittedExpensesStore()

    expect(await store.shouldOnboard()).toBe(false)
  })

  it('a failed check never forces onboarding', async () => {
    listMock.mockRejectedValue(new Error('offline'))
    const store = useCommittedExpensesStore()

    expect(await store.shouldOnboard()).toBe(false)
  })

  it('setHasAny settles the decision without an API call (onboarding just wrote the first row)', async () => {
    const store = useCommittedExpensesStore()
    store.setHasAny(true)

    expect(await store.shouldOnboard()).toBe(false)
    expect(listMock).not.toHaveBeenCalled()
  })

  it('reset re-arms the check for the next user', async () => {
    listMock.mockResolvedValue([])
    const store = useCommittedExpensesStore()

    await store.shouldOnboard()
    store.reset()
    listMock.mockResolvedValue([])

    expect(await store.shouldOnboard()).toBe(true)
    expect(listMock).toHaveBeenCalledTimes(2)
  })
})
