import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import WeeklyLog from '../views/WeeklyLog.vue'
import Login from '../views/Login.vue'

// Rebuild the router with the same guard logic for unit testing.
// We use hash history to avoid jsdom URL issues.
function makeRouter() {
  const routes: RouteRecordRaw[] = [
    {
      path: '/',
      name: 'WeeklyLog',
      component: WeeklyLog,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
  ]

  const r = createRouter({ history: createWebHashHistory(), routes })

  r.beforeEach((to) => {
    const authStore = useAuthStore()
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return { name: 'Login' }
    }
  })

  return r
}

describe('router auth guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allows authenticated user to reach WeeklyLog (/)', async () => {
    const router = makeRouter()
    // isAuthenticated defaults true
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('WeeklyLog')
  })

  it('redirects unauthenticated user from / to Login', async () => {
    const router = makeRouter()
    const store = useAuthStore()
    store.isAuthenticated = false
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('allows unauthenticated user to reach Login directly', async () => {
    const router = makeRouter()
    const store = useAuthStore()
    store.isAuthenticated = false
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('WeeklyLog route has requiresAuth meta set', () => {
    const router = makeRouter()
    const route = router.getRoutes().find((r) => r.name === 'WeeklyLog')
    expect(route?.meta.requiresAuth).toBe(true)
  })

  it('Login route does not have requiresAuth meta', () => {
    const router = makeRouter()
    const route = router.getRoutes().find((r) => r.name === 'Login')
    expect(route?.meta.requiresAuth).toBeFalsy()
  })
})
