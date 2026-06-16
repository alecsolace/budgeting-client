import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(true) // dev: always authenticated; swap with Supabase session check
  const user = ref<{ id: string; email: string } | null>(null)

  return { isAuthenticated, user }
})
