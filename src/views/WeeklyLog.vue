<template>
  <v-container
    class="weekly-log"
    :max-width="640"
  >
    <h1 class="text-week-title">
      Weekly Log
    </h1>
    <p class="text-body text-muted-color">
      Ready for your weekly check-in?
    </p>
  </v-container>
</template>

<script setup lang="ts">
// WeeklyLog — layout shell stub. 640px max-width, Lune typography applied.
// Committed + Discretionary sections, progress bar, and reflection prompt come next.
</script>

<style scoped>
.weekly-log {
  padding-top: var(--space-2xl);
}

.text-muted-color {
  color: var(--text-muted);
}
</style>
