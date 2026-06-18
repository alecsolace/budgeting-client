<template>
  <v-container
    class="login"
    :max-width="CONTENT_MAX_WIDTH"
  >
    <h1 class="text-week-title">
      Sign in
    </h1>
  </v-container>
</template>

<script setup lang="ts">
import { CONTENT_MAX_WIDTH } from '../constants/layout'
// Login — placeholder route target only. Supabase auth wired here later.
</script>

<style scoped>
.login {
  padding-top: var(--space-2xl);
}
</style>
