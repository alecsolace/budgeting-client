<template>
  <v-container class="lune-callback" max-width="400">
    <p class="text-body lune-callback__copy" role="status" aria-live="polite">Signing you in…</p>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { sanitizeRedirect } from '../plugins/router'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  // Read the intended destination before anything touches the URL.
  const target = sanitizeRedirect(route.query.redirect)
  const tokenHash = typeof route.query.token_hash === 'string' ? route.query.token_hash : null
  const type = typeof route.query.type === 'string' ? route.query.type : null

  try {
    if (tokenHash && type === 'email') {
      // The email templates send a token hash rather than a reusable session.
      // Verifying it both confirms a new address and signs the person in.
      await authStore.verifyMagicLink(tokenHash)
    } else {
      // Keep accepting Supabase's standard PKCE ?code= redirect. It supports
      // links issued before the email templates were updated.
      await authStore.initialize()
    }
  } catch {
    // A failed or expired code just means "still signed out". Fall through:
    // the route guard decides where that lands, and stranding the user on this
    // screen would be worse than an ordinary trip back to /login.
  }

  // Scrub the one-time code (and the redirect param) out of the address bar and
  // out of the back-stack, so it can't leak via history, bookmarks, or a
  // Referer header on a later outbound request.
  if (typeof window !== 'undefined' && typeof window.history?.replaceState === 'function') {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }

  // replace(), not push() — /auth/callback must never sit in the back-stack.
  await router.replace(target)
})
</script>

<style scoped>
.lune-callback {
  padding-top: var(--space-3xl);
  text-align: center;
}

.lune-callback__copy {
  color: var(--v-text-muted);
}
</style>
