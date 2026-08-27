<template>
  <div class="committed-row" @focusout="handleFocusOut">
    <div class="committed-row__fields">
      <v-text-field
        :model-value="modelValue.name"
        class="committed-row__name"
        placeholder="e.g. Rent"
        density="comfortable"
        hide-details="auto"
        :error="invalidFields.includes('name')"
        :aria-label="'Expense name'"
        @update:model-value="patch('name', $event)"
      />

      <div class="committed-row__amount">
        <v-text-field
          :model-value="amountText"
          class="committed-row__amount-field"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          density="comfortable"
          hide-details="auto"
          :error="invalidFields.includes('amount')"
          :aria-label="'Amount'"
          @update:model-value="patchAmount"
        />
        <p v-if="weeklyEquivalent !== null" class="committed-row__weekly text-meta">
          {{ weeklyEquivalent }}/wk
        </p>
      </div>

      <v-select
        :model-value="modelValue.frequency"
        class="committed-row__frequency"
        :items="frequencyItems"
        density="comfortable"
        hide-details="auto"
        :aria-label="'Frequency'"
        @update:model-value="patch('frequency', $event)"
      />

      <v-select
        :model-value="modelValue.category"
        class="committed-row__category"
        :items="categoryItems"
        density="comfortable"
        hide-details="auto"
        :aria-label="'Category'"
        @update:model-value="patch('category', $event)"
      />

      <v-btn
        v-if="deletable"
        class="committed-row__delete"
        variant="text"
        icon="mdi-close"
        size="small"
        :aria-label="`Delete ${modelValue.name || 'expense'}`"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CATEGORY_OPTIONS,
  FREQUENCY_OPTIONS,
  WEEKS_PER_MONTH,
  type CommittedCategory,
  type CommittedExpenseDraft,
  type CommittedFrequency,
} from '../services/committedExpenses'

const props = withDefaults(
  defineProps<{
    modelValue: CommittedExpenseDraft
    /** Show the delete button. Settings: true; onboarding: false (issue #7). */
    deletable?: boolean
    /** Field keys the parent has flagged as invalid — rendered in error state. */
    invalidFields?: Array<keyof CommittedExpenseDraft>
  }>(),
  { deletable: false, invalidFields: () => [] },
)

const emit = defineEmits<{
  'update:modelValue': [value: CommittedExpenseDraft]
  delete: []
  /** Focus has left the row entirely — the cue to persist an edit (issue #7). */
  blur: []
}>()

// `focusout` bubbles from each field. Saving at that point covers the promised
// "tab away" behaviour as well as clicking outside the row; the parent skips
// no-op snapshots, so moving through untouched fields does not write anything.
function handleFocusOut() {
  emit('blur')
}

const invalidFields = computed(() => props.invalidFields)

// Title-case labels for the selects; the value stays the lowercase enum.
const frequencyItems = FREQUENCY_OPTIONS.map((value) => ({ title: titleCase(value), value }))
const categoryItems = CATEGORY_OPTIONS.map((value) => ({ title: titleCase(value), value }))

// An amount of 0 reads as "unset" in both entry points, so show an empty field
// rather than a literal "0" the user has to clear before typing.
const amountText = computed(() => (props.modelValue.amount ? String(props.modelValue.amount) : ''))

const weeklyEquivalent = computed(() => {
  if (props.modelValue.frequency !== 'monthly' || !props.modelValue.amount) {
    return null
  }
  return formatCurrency(props.modelValue.amount / WEEKS_PER_MONTH)
})

function patch<K extends keyof CommittedExpenseDraft>(key: K, value: CommittedExpenseDraft[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function patchAmount(raw: string) {
  const parsed = Number.parseFloat(raw)
  patch('amount', Number.isFinite(parsed) && parsed > 0 ? parsed : 0)
}

function titleCase(value: CommittedFrequency | CommittedCategory): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}
</script>

<style scoped>
.committed-row {
  padding: var(--space-sm) 0;
}

.committed-row__fields {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: var(--space-sm);
  align-items: start;
}

.committed-row__weekly {
  margin: var(--space-2xs) 0 0;
  padding-left: var(--space-sm);
  font-size: 11px;
  color: var(--v-text-muted);
}

.committed-row__delete {
  margin-top: var(--space-2xs);
  color: var(--v-text-muted);
}

@media (max-width: 640px) {
  .committed-row__fields {
    grid-template-columns: 1fr 1fr;
  }

  .committed-row__name {
    grid-column: 1 / -1;
  }

  .committed-row__delete {
    grid-column: 2;
    justify-self: end;
  }
}
</style>
