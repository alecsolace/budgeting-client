import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const { session, user, isAuthenticated } = storeToRefs(authStore)

  return {
    session,
    user,
    isAuthenticated,
    initialize: authStore.initialize,
    signIn: authStore.signIn,
    signOut: authStore.signOut,
  }
}
