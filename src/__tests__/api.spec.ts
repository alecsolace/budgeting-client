import { describe, it, expect } from 'vitest'
import { api } from '../services/api'

describe('api', () => {
  it('exports an axios instance', () => {
    expect(api).toBeDefined()
    expect(typeof api.get).toBe('function')
  })

  it('baseURL falls back to localhost:5000 when VITE_API_BASE_URL is not set', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:5000')
  })
})
