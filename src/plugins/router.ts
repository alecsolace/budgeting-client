import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import WeeklyLog from '../views/WeeklyLog.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    component: WeeklyLog,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    component: Login,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }
})

export default router
