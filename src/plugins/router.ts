import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCommittedExpensesStore } from '../stores/committedExpenses'
import { sanitizeRedirect } from '../utils/redirect'

// Re-exported so existing call sites (views, tests) don't need to change
// import paths — the implementation lives in utils/redirect.ts because
// stores/auth.ts needs it too, and importing it from here would cycle back
// through this module's own import of useAuthStore.
export { sanitizeRedirect }

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

router.beforeEach(async (to, from) => {
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

  // First-run onboarding (issue #7 AC1): an authenticated user arriving at the
  // weekly log with zero committed expenses is sent to set them up. The check
  // runs at most once per session and never bounces a user who just came from
  // /onboarding (they may have chosen to skip).
  if (
    to.name === 'weekly-log' &&
    authStore.isAuthenticated &&
    from.name !== 'onboarding'
  ) {
    const committedStore = useCommittedExpensesStore()
    if (await committedStore.shouldOnboard()) {
      return { name: 'onboarding' }
    }
  }
})

export default router
