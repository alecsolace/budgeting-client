import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Dev default: always authenticated. Swap with Supabase session check to go live.
  const isAuthenticated = ref(true)
  const user = ref<{ id: string; email: string } | null>(null)

  return { isAuthenticated, user }
})
