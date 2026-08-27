<template>
  <v-container class="lune-notfound" max-width="640">
    <h1 class="text-week-title">Nothing here.</h1>
    <p class="text-body lune-notfound__copy">
      That page doesn't exist — no harm done. Your weekly log is right where you left it.
    </p>
    <router-link to="/" class="text-button lune-notfound__link">Back to this week</router-link>
  </v-container>
</template>

<script setup lang="ts">
// Friendly 404. Nothing here is the user's fault, and the copy shouldn't imply it is.
</script>

<style scoped>
.lune-notfound {
  padding-top: var(--space-2xl);
}

.lune-notfound__copy {
  margin-top: var(--space-md);
  color: var(--v-text-muted);
}

.lune-notfound__link {
  display: inline-block;
  margin-top: var(--space-lg);
  color: rgb(var(--v-theme-cta));
  text-decoration: none;
  border-bottom: 1px solid currentcolor;
  padding-bottom: var(--space-2xs);
}

.lune-notfound__link:hover {
  opacity: 0.85;
}

.lune-notfound__link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
</style>
