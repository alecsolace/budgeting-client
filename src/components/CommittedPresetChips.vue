<template>
  <div>
    <h2 :id="headingId" class="text-body lune-chips__label">
      Which of these do you pay for?
    </h2>

    <div class="lune-chips" role="group" :aria-labelledby="headingId">
      <button
        v-for="preset in presets"
        :key="preset.name"
        type="button"
        class="lune-chip lune-button"
        :class="{ 'lune-chip--used': isUsed(preset.name) }"
        :aria-pressed="isUsed(preset.name)"
        :disabled="disabled"
        @click="$emit('pick', preset)"
      >
        {{ preset.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { COMMITTED_PRESETS, type CommittedPreset } from '../services/committedExpenses'

const props = withDefaults(
  defineProps<{
    /** Names already on the list, matched case-insensitively so a typed
     *  "rent" still marks the Rent chip as used. */
    usedNames: string[]
    disabled?: boolean
  }>(),
  { disabled: false },
)

defineEmits<{ pick: [preset: CommittedPreset] }>()

const presets = COMMITTED_PRESETS
const headingId = 'committed-presets-heading'

function isUsed(name: string): boolean {
  const target = name.toLowerCase()
  return props.usedNames.some((used) => used.trim().toLowerCase() === target)
}
</script>

<style scoped>
.lune-chips__label {
  margin: 0 0 var(--space-sm);
  font-weight: 400;
  color: var(--lune-text-muted);
}

.lune-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.lune-chip {
  min-height: 44px;
  padding: 10px var(--space-md);
  color: rgb(var(--v-theme-on-background));
  background: transparent;
  border: 1px solid var(--lune-border);
  /* Pills, per DESIGN.md's radius scale. Reads as "tap me", not "type here" —
     the distinction the whole screen rests on. */
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    border-color var(--duration-short) var(--ease-move),
    background-color var(--duration-short) var(--ease-move);
}

/* Scoped off the used state: .lune-chip--used sets a sage border, and an
   unscoped :hover (equal specificity, later in the file) would override it —
   so hovering a selected chip would drop its "selected" outline. */
.lune-chip:not(.lune-chip--used):hover {
  border-color: var(--lune-border-strong);
}

.lune-chip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.lune-chip:disabled {
  cursor: wait;
  opacity: 0.6;
}

/* Already on the list. Kept enabled — tapping again is a reasonable way to add
   a second phone bill, and disabling it would strand keyboard focus. */
.lune-chip--used {
  color: var(--lune-committed);
  background: var(--lune-committed-soft);
  border-color: var(--lune-committed);
}
</style>
