import axios from 'axios'
import { supabase } from '../plugins/supabase'
import router from '../plugins/router'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

const windowOrigin = typeof window !== 'undefined' ? window.location.origin : undefined

// `new URL(url, base)` throws when `base` isn't itself absolute — which
// includes a relative `VITE_API_BASE_URL` such as '/api' (a legitimate config
// behind a reverse proxy), not just an undefined base. Resolve `base` against
// the app's own origin first so a relative base becomes absolute; an
// already-absolute base passes through new URL(base, windowOrigin)
// unchanged. Without this, a relative base silently nulls apiOrigin and the
// Authorization header is never attached to any request.
// Exported for direct unit testing — `baseURL` above is captured once at
// module load from import.meta.env, so exercising the relative-base case
// through the whole module would mean re-importing with a different env per
// test rather than just calling the function.
export function resolveOrigin(url: string | undefined, base: string | undefined): string | null {
  let effectiveBase = windowOrigin
  if (base) {
    try {
      effectiveBase = new URL(base, windowOrigin).href
    } catch {
      return null
    }
  }
  try {
    return new URL(url ?? '', effectiveBase).origin
  } catch {
    return null
  }
}

const apiOrigin = resolveOrigin(baseURL, undefined)

// Attach the bearer token only when the resolved request origin matches our
// own API's origin — never forward the Supabase JWT to a third-party host,
// even if an absolute URL is ever passed through this axios instance.
api.interceptors.request.use(async (config) => {
  const requestOrigin = resolveOrigin(config.url, config.baseURL ?? baseURL)

  if (requestOrigin && apiOrigin && requestOrigin === apiOrigin) {
    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token
    if (accessToken) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }
  }

  return config
})

// Single-flight guard: N concurrent 401s should trigger exactly one
// sign-out and one navigation, not one per failed request.
let signOutInFlight = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && !signOutInFlight) {
      signOutInFlight = true
      try {
        // scope: 'local' — the token is already dead server-side, this just
        // clears our own client state (auth store updates via onAuthStateChange).
        await supabase.auth.signOut({ scope: 'local' })
        await router.push('/login')
      } finally {
        signOutInFlight = false
      }
    }
    return Promise.reject(error)
  },
)
