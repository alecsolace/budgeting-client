import { describe, expect, it } from 'vitest'
import { weeklyEquivalent } from '../services/committedExpenses'

describe('weeklyEquivalent', () => {
  it('returns zero for an empty amount', () => {
    expect(weeklyEquivalent(0, 'monthly')).toBe(0)
  })

  it('keeps weekly amounts unchanged', () => {
    expect(weeklyEquivalent(25, 'weekly')).toBe(25)
  })

  it('spreads annual amounts over 52 weeks', () => {
    expect(weeklyEquivalent(520, 'annual')).toBe(10)
  })
})
