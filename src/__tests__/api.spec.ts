import { describe, it, expect } from 'vitest'
import { api } from '../services/api'

describe('api', () => {
  it('baseURL reads VITE_API_BASE_URL (falls back to localhost:5000 in test env)', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:5000')
  })
})
