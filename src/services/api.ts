import axios from 'axios'
import { supabase } from '../plugins/supabase'
import router from '../plugins/router'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

function resolveOrigin(url: string | undefined, base: string | undefined): string | null {
  try {
    return new URL(url ?? '', base).origin
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
