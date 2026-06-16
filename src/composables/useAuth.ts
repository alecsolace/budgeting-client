import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    // Swap Supabase session check here when wiring auth
  }
}
