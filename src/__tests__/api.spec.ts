import { describe, it, expect, vi } from 'vitest'
import { api } from '../services/api'

describe('api', () => {
  it('exports an axios instance', () => {
    expect(api).toBeDefined()
    expect(typeof api.get).toBe('function')
  })

  it('baseURL falls back to localhost:5000 when VITE_API_BASE_URL is not set', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:5000')
  })

  it('baseURL uses VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.resetModules()
    const { api: freshApi } = await import('../services/api')
    expect(freshApi.defaults.baseURL).toBe('https://api.example.com')
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
