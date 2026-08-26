import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'weekly-log',
    component: () => import('../views/WeeklyLog.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('../views/AuthCallback.vue'),
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('../views/Onboarding.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/committed',
    name: 'settings-committed',
    component: () => import('../views/SettingsCommitted.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/summary/:weekStart',
    name: 'summary',
    component: () => import('../views/Summary.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Accept only a same-origin, path-relative redirect target. Rejects
// protocol-relative ('//evil.com') and backslash-disguised ('/\\evil.com')
// forms that browsers/some parsers treat as absolute — closes an
// open-redirect hole on the post-login redirect.
export function sanitizeRedirect(redirect: unknown): string {
  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.startsWith('/\\')
  ) {
    return redirect
  }
  return '/'
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  // An already-signed-in user has nothing to do on /login — send them home
  // rather than offering a second, pointless magic-link round trip.
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { path: '/' }
  }
})

export default router
