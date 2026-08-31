<template>
  <v-container class="lune-stub" max-width="640">
    <h1 class="text-week-title">Your week</h1>
    <p class="text-body lune-stub__copy">Coming soon — a calm look back at the week you closed.</p>
  </v-container>
</template>

<script setup lang="ts">
// Stub route target. Implemented in issue #9.
</script>

<style scoped>
.lune-stub {
  padding-top: var(--space-2xl);
}

.lune-stub__copy {
  margin-top: var(--space-md);
  color: var(--lune-text-muted);
}
</style>
