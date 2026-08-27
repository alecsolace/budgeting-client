<template>
  <v-container class="weekly-log" max-width="640">
    <h1 class="text-week-title mb-4">Weekly Log</h1>
    <p class="text-body">Track your spending for the week.</p>

    <section class="weekly-log__committed" aria-labelledby="committed-heading">
      <div class="weekly-log__section-header">
        <h2 id="committed-heading" class="text-meta weekly-log__section-title">COMMITTED</h2>
        <RouterLink to="/settings/committed" class="text-meta weekly-log__edit">
          Edit ›
        </RouterLink>
      </div>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.weekly-log__committed {
  margin-top: var(--space-xl);
}

.weekly-log__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--v-border, #e2d9cc);
}

.weekly-log__section-title,
.weekly-log__edit {
  font-size: 11px;
  color: var(--v-text-muted);
}

.weekly-log__section-title {
  letter-spacing: 0.08em;
}

.weekly-log__edit {
  text-decoration: none;
}

.weekly-log__edit:hover,
.weekly-log__edit:focus-visible {
  text-decoration: underline;
}
</style>
