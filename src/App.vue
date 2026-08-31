<template>
  <v-app :theme="theme">
    <v-main>
      <!-- Quiet linen stand-in that mirrors the shape of the first screen. A
           blank white frame during session restore reads as breakage. -->
      <div v-if="!ready" class="lune-boot" aria-hidden="true">
        <div class="lune-boot__column">
          <div class="lune-boot__line lune-boot__line--title"></div>
          <div class="lune-boot__line lune-boot__line--subtitle"></div>
          <div class="lune-boot__field"></div>
          <div class="lune-boot__cta"></div>
        </div>
      </div>

      <template v-else>
        <div v-if="isAuthenticated" class="lune-account">
          <v-btn
            variant="text"
            size="small"
            class="lune-button lune-account__signout"
            @click="handleSignOut"
          >
            Sign out
          </v-btn>
        </div>

        <router-view />
      </template>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

const ready = ref(false)

// Follow the OS setting rather than pinning the app to light — the dark
// palette is otherwise unreachable, which makes it untestable too.
const darkQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

const theme = ref(darkQuery?.matches ? 'luneDark' : 'luneLight')

function applyScheme(event: MediaQueryListEvent | MediaQueryList) {
  theme.value = event.matches ? 'luneDark' : 'luneLight'
}

onMounted(async () => {
  darkQuery?.addEventListener('change', applyScheme)

  try {
    await authStore.initialize()
  } finally {
    // Render regardless: a failed session lookup means "signed out", and the
    // route guard handles that. It must never mean "stuck on a placeholder".
    ready.value = true
  }
})

onBeforeUnmount(() => {
  darkQuery?.removeEventListener('change', applyScheme)
})

async function handleSignOut() {
  try {
    await authStore.signOut()
  } finally {
    await router.push('/login')
  }
}
</script>

<style scoped>
.lune-boot {
  display: flex;
  justify-content: center;
  min-height: 100%;
  padding-top: var(--space-3xl);
  background-color: rgb(var(--v-theme-background));
}

.lune-boot__column {
  width: 100%;
  max-width: 400px;
  padding: 0 var(--space-md);
}

.lune-boot__line {
  border-radius: var(--radius-sm);
  background-color: var(--lune-border);
  opacity: 0.5;
}

.lune-boot__line--title {
  width: 62%;
  height: 32px;
}

.lune-boot__line--subtitle {
  width: 84%;
  height: 15px;
  margin-top: var(--space-md);
}

.lune-boot__field {
  height: 52px;
  margin-top: var(--space-xl);
  border: 1px solid var(--lune-border);
  border-radius: var(--radius-md);
  opacity: 0.5;
}

.lune-boot__cta {
  height: 44px;
  margin-top: var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--lune-border);
  opacity: 0.5;
}

.lune-account {
  display: flex;
  justify-content: flex-end;
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-sm) var(--space-md) 0;
}

.lune-account__signout {
  min-height: 44px;
  color: var(--lune-text-muted);
  text-transform: none;
  letter-spacing: 0.01em;
}
</style>
