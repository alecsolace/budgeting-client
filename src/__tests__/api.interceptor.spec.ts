import { describe, it, expect } from 'vitest'
import { api } from '../services/api'

describe('api defaults', () => {
  it('sets Content-Type to application/json by default', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })
})
