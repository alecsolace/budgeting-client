import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import WeeklyLog from '../views/WeeklyLog.vue'
import Login from '../views/Login.vue'

function makeRouter() {
  const r = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: WeeklyLog, meta: { requiresAuth: true } },
      { path: '/login', component: Login },
    ],
  })
  r.beforeEach((to) => {
    const authStore = useAuthStore()
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return '/login'
    }
  })
  return r
}

describe('router nav guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allows navigation to protected route when authenticated', async () => {
    const router = makeRouter()
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects to /login when unauthenticated on protected route', async () => {
    const router = makeRouter()
    const authStore = useAuthStore()
    authStore.isAuthenticated = false
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows navigation to /login without auth (public route)', async () => {
    const router = makeRouter()
    const authStore = useAuthStore()
    authStore.isAuthenticated = false
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
