import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'WeeklyLog',
    component: () => import('../views/WeeklyLog.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Auth guard — reads authStore.isAuthenticated (defaults true in dev).
// To go live: replace store value with a Supabase session check in stores/auth.ts.
router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login' }
  }
})
