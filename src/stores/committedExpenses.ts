import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listCommittedExpenses } from '../services/committedExpenses'

// Backs the onboarding redirect guard (issue #7 AC1): a brand-new user with
// zero committed expenses is sent to /onboarding once. The result is cached
// for the session so the guard doesn't hit the API on every navigation to '/'.
export const useCommittedExpensesStore = defineStore('committedExpenses', () => {
  // null = not fetched yet this session.
  const hasAny = ref<boolean | null>(null)

  // Whether the one-per-session onboarding redirect decision has been made.
  const onboardingChecked = ref(false)

  let inFlight: Promise<boolean> | null = null

  // Returns whether the user has at least one committed expense, fetching once
  // and reusing the answer thereafter. Concurrent callers share one request.
  async function ensureChecked(): Promise<boolean> {
    if (hasAny.value !== null) {
      return hasAny.value
    }
    if (!inFlight) {
      inFlight = listCommittedExpenses()
        .then((expenses) => {
          hasAny.value = expenses.length > 0
          return hasAny.value
        })
        .finally(() => {
          inFlight = null
        })
    }
    return inFlight
  }

  // Router-guard helper: true only the first time it's asked in a session and
  // only when the user has no committed expenses. A failed check never blocks
  // navigation.
  async function shouldOnboard(): Promise<boolean> {
    if (onboardingChecked.value) {
      return false
    }
    onboardingChecked.value = true
    try {
      return !(await ensureChecked())
    } catch {
      return false
    }
  }

  // Called after a write so the guard's cached answer stays truthful — e.g.
  // onboarding just created the first expense, or settings deleted the last.
  // Any onboarding outcome also settles the once-per-session redirect decision.
  function setHasAny(value: boolean): void {
    hasAny.value = value
    onboardingChecked.value = true
  }

  // On sign-out the next user's answer must be recomputed.
  function reset(): void {
    hasAny.value = null
    onboardingChecked.value = false
    inFlight = null
  }

  return { hasAny, onboardingChecked, ensureChecked, shouldOnboard, setHasAny, reset }
})
