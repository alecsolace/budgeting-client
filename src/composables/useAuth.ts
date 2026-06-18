import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const { isAuthenticated, user } = storeToRefs(useAuthStore())
  return { isAuthenticated, user }
}
