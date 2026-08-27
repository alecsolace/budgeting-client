<template>
  <v-container class="lune-login" max-width="400">
    <!-- Persistent live region: the success copy is announced when it appears
         without the region itself being inserted at the same moment. -->
    <div class="lune-login__sent" role="status" aria-live="polite">
      <p v-if="sent" class="text-prompt lune-login__sent-copy">
        Check your inbox — the link is on its way.
      </p>
    </div>

    <template v-if="!sent">
      <h1 class="text-week-title lune-login__title">Good to see you.</h1>
      <p class="text-body lune-login__subtitle">We'll send you a link — no password needed.</p>

      <form class="lune-login__form" novalidate @submit.prevent="submit">
        <label for="login-email" class="text-body lune-login__label">Email</label>
        <v-text-field
          id="login-email"
          v-model="email"
          name="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          spellcheck="false"
          maxlength="254"
          :aria-describedby="describedBy"
          :error="Boolean(hintMessage)"
          :error-messages="hintMessage ? [hintMessage] : []"
          hide-details="auto"
          density="comfortable"
          @blur="handleBlur"
        />

        <v-btn
          type="submit"
          color="cta"
          block
          class="lune-button lune-login__cta"
          :disabled="!canSubmit"
          :loading="sending"
          :aria-busy="sending ? 'true' : 'false'"
        >
          {{ ctaLabel }}
        </v-btn>

        <!-- Error region lives below the CTA and stays mounted so screen
             readers announce a change of content, not an insertion. -->
        <div class="lune-login__status" role="status" aria-live="polite">
          <p v-if="errorMessage" id="login-error" class="text-body lune-login__error">
            {{ errorMessage }}
          </p>
        </div>
      </form>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { sanitizeRedirect } from '../utils/redirect'

const COOLDOWN_SECONDS = 60

// Deliberately permissive. Real deliverability is decided by the mail server;
// this only exists to stop an obviously-unfinished address being submitted.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

const email = ref('')
const touched = ref(false)
const sending = ref(false)
const sent = ref(false)
const errorMessage = ref('')
const cooldown = ref(0)

let cooldownTimer: ReturnType<typeof setInterval> | null = null

const looksLikeEmail = computed(() => EMAIL_SHAPE.test(email.value.trim()))

// Validation is evaluated on blur only. Turning a field red while someone is
// still mid-address is punitive, and this product does not do punitive.
const hintMessage = computed(() => {
  if (!touched.value || email.value.trim().length === 0 || looksLikeEmail.value) {
    return ''
  }
  return "That doesn't look like an email address yet."
})

const canSubmit = computed(() => looksLikeEmail.value && !sending.value && cooldown.value === 0)

const ctaLabel = computed(() =>
  cooldown.value > 0 ? `Try again in ${cooldown.value}s` : 'Send my link',
)

const describedBy = computed(() => (errorMessage.value ? 'login-error' : undefined))

function handleBlur() {
  touched.value = true
}

function stopCooldown() {
  if (cooldownTimer !== null) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

function startCooldown(seconds: number) {
  stopCooldown()
  cooldown.value = seconds
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) {
      cooldown.value = 0
      stopCooldown()
    }
  }, 1000)
}

// Supabase returns HTTP 429 when an address asks for a second OTP inside its
// ~60s window. Surface the wait instead of letting someone hammer retry into
// a wall of identical failures.
function isRateLimited(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const candidate = error as { status?: number; code?: string }
  return candidate.status === 429 || candidate.code === 'over_email_send_rate_limit'
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  touched.value = true
  errorMessage.value = ''
  sending.value = true

  try {
    // Embed the intended destination in the magic-link's callback URL —
    // the link is usually opened in a fresh tab from the mail client, so
    // there is no ?redirect= to fall back on once AuthCallback loads there.
    await authStore.signIn(email.value, route.query.redirect)
    // Identical outcome whether or not this address has an account. Any
    // divergence here — different copy, a different delay, a different route —
    // is a user-enumeration oracle.
    sent.value = true
  } catch (error) {
    if (isRateLimited(error)) {
      startCooldown(COOLDOWN_SECONDS)
      errorMessage.value = "A link is already on its way — you can ask for another in a moment."
    } else {
      // Never render the provider's message: it distinguishes "user not found"
      // from "rate limited" from "invalid key", and leaks internals besides.
      errorMessage.value = 'Something went wrong — try again?'
    }
  } finally {
    sending.value = false
  }
}

// If a session lands while this page is open (same-tab magic link, or a
// session restored underneath us), honour the guard's ?redirect= target.
watch(isAuthenticated, (authed) => {
  if (authed) {
    void router.replace(sanitizeRedirect(route.query.redirect))
  }
})

onBeforeUnmount(stopCooldown)
</script>

<style scoped>
.lune-login {
  padding-top: var(--space-3xl);
}

.lune-login__title {
  color: rgb(var(--v-theme-on-background));
}

.lune-login__subtitle {
  margin-top: var(--space-sm);
  color: var(--lune-text-muted);
}

.lune-login__form {
  margin-top: var(--space-xl);
}

.lune-login__label {
  display: block;
  margin-bottom: var(--space-sm);
  color: rgb(var(--v-theme-on-background));
}

.lune-login__form :deep(.v-field__outline) {
  --v-field-border-opacity: 1;

  color: var(--lune-border-input);
}

.lune-login__cta {
  margin-top: var(--space-md);
  min-height: 44px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.01em;
}

.lune-login__cta:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}

.lune-login__form :deep(.v-field.v-field--focused .v-field__outline) {
  color: rgb(var(--v-theme-primary));
}

.lune-login__status {
  min-height: var(--space-lg);
  margin-top: var(--space-sm);
}

.lune-login__error {
  color: rgb(var(--v-theme-error));
}

.lune-login__sent-copy {
  padding-top: var(--space-3xl);
  color: rgb(var(--v-theme-on-background));
}
</style>
