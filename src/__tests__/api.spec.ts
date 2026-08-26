import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'

vi.mock('@supabase/supabase-js', () => import('./mocks/supabase'))

// vi.mock is hoisted above the imports, so the stub has to be hoisted too.
const routerMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))
vi.mock('../plugins/router', () => ({ default: routerMock }))

import { authMock, fakeSession, resetSupabaseMock } from './mocks/supabase'
import { api } from '../services/api'

// Axios exposes its registered interceptors on `.handlers`; driving them
// directly keeps these assertions on our own logic instead of on a network
// stub, and guarantees no request ever leaves the process.
interface InterceptorHandler<T> {
  fulfilled: (value: T) => T | Promise<T>
  rejected: (error: unknown) => unknown
}

function requestInterceptor() {
  const manager = api.interceptors.request as unknown as {
    handlers: InterceptorHandler<InternalAxiosRequestConfig>[]
  }
  return manager.handlers[0].fulfilled
}

function responseErrorInterceptor() {
  const manager = api.interceptors.response as unknown as {
    handlers: InterceptorHandler<unknown>[]
  }
  return manager.handlers[0].rejected
}

function configFor(url: string): InternalAxiosRequestConfig {
  return { url, headers: {} } as unknown as InternalAxiosRequestConfig
}

describe('api', () => {
  beforeEach(() => {
    resetSupabaseMock()
    routerMock.push.mockReset()
    routerMock.replace.mockReset()
    authMock.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null })
  })

  it('baseURL reads VITE_API_BASE_URL', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:5000')
  })

  it('attaches the bearer token to a relative (API-origin) request', async () => {
    const config = await requestInterceptor()(configFor('/weeks/current'))

    expect(config.headers.Authorization).toBe('Bearer test-access-token')
  })

  it('attaches the bearer token to an absolute URL on the API origin', async () => {
    const config = await requestInterceptor()(configFor('http://localhost:5000/weeks/current'))

    expect(config.headers.Authorization).toBe('Bearer test-access-token')
  })

  it('does NOT attach the bearer token to a cross-origin absolute URL', async () => {
    const config = await requestInterceptor()(configFor('https://evil.example.com/collect'))

    expect(config.headers.Authorization).toBeUndefined()
    // The token must not even be read for a foreign host.
    expect(authMock.getSession).not.toHaveBeenCalled()
  })

  it('does NOT attach the bearer token to a protocol-relative foreign URL', async () => {
    const config = await requestInterceptor()(configFor('//evil.example.com/collect'))

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('signs out and navigates exactly once for N concurrent 401s', async () => {
    const unauthorized = { response: { status: 401 } }
    const reject = responseErrorInterceptor()

    const settled = await Promise.allSettled([
      reject(unauthorized),
      reject(unauthorized),
      reject(unauthorized),
      reject(unauthorized),
    ])

    expect(settled.every((result) => result.status === 'rejected')).toBe(true)
    expect(authMock.signOut).toHaveBeenCalledTimes(1)
    expect(authMock.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(routerMock.push).toHaveBeenCalledTimes(1)
    expect(routerMock.push).toHaveBeenCalledWith('/login')
  })

  it('leaves non-401 failures alone', async () => {
    await expect(responseErrorInterceptor()({ response: { status: 500 } })).rejects.toBeTruthy()

    expect(authMock.signOut).not.toHaveBeenCalled()
    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
