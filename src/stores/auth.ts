import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  if (import.meta.env.PROD) {
    console.error('[auth] Dev stub is active — replace with Supabase session in stores/auth.ts before shipping.')
  }
  // Defaults true in dev so all routes are accessible during scaffolding.
  // Supabase session will set this to the real value when wired.
  const isAuthenticated = ref(import.meta.env.DEV)
  const user = ref<{ id: string; email: string } | null>(null)

  return { isAuthenticated, user }
})
