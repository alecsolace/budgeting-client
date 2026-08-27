<template>
  <v-container class="onboarding" max-width="640">
    <h1 class="text-week-title onboarding__title">Let's start with what you have to pay.</h1>
    <p class="text-body onboarding__intro">
      Rent, subscriptions, debt payments — the stuff that happens every month whether you want it to
      or not. Add them now; takes about 5 minutes.
    </p>

    <form class="onboarding__form" novalidate @submit.prevent="submit">
      <CommittedExpenseRow
        v-for="(row, index) in rows"
        :key="row.key"
        v-model="row.draft"
        :invalid-fields="row.errors"
        @update:model-value="clearErrors(index)"
      />

      <button type="button" class="lune-add-row onboarding__add lune-button" @click="addRow">
        + Add another
      </button>

      <div class="onboarding__status" role="status" aria-live="polite">
        <p v-if="errorMessage" class="text-body onboarding__error">{{ errorMessage }}</p>
      </div>

      <v-btn
        type="submit"
        color="cta"
        block
        class="lune-button onboarding__cta"
        :loading="saving"
        :aria-busy="saving ? 'true' : 'false'"
      >
        I'm done setting up
      </v-btn>
    </form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CommittedExpenseRow from '../components/CommittedExpenseRow.vue'
import {
  createCommittedExpense,
  type CommittedExpenseDraft,
} from '../services/committedExpenses'
import { useCommittedExpensesStore } from '../stores/committedExpenses'

const INITIAL_ROWS = 3

const router = useRouter()
const committedStore = useCommittedExpensesStore()

interface EditableRow {
  key: number
  draft: CommittedExpenseDraft
  errors: Array<keyof CommittedExpenseDraft>
  // A fulfilled POST is retained locally if a sibling request fails, so a
  // retry never creates a duplicate expense.
  saved: boolean
}

let nextKey = 0

function emptyRow(): EditableRow {
  return {
    key: nextKey++,
    draft: { name: '', amount: 0, frequency: 'monthly', category: 'other' },
    errors: [],
    saved: false,
  }
}

const rows = ref<EditableRow[]>(Array.from({ length: INITIAL_ROWS }, emptyRow))
const saving = ref(false)
const errorMessage = ref('')

function addRow() {
  rows.value.push(emptyRow())
}

function clearErrors(index: number) {
  const row = rows.value[index]
  if (row && row.errors.length) {
    row.errors = []
  }
}

function isFilled(value: string): boolean {
  return value.trim().length > 0
}

async function submit() {
  if (saving.value) {
    return
  }
  errorMessage.value = ''

  // A row with exactly one of {name, amount} filled is an unfinished entry —
  // flag the missing field and block. Rows with neither are silently skipped
  // (issue #7 submit behaviour 5–6).
  let hasPartial = false
  for (const row of rows.value) {
    const nameFilled = isFilled(row.draft.name)
    const amountFilled = row.draft.amount > 0
    const errors: Array<keyof CommittedExpenseDraft> = []
    if (nameFilled !== amountFilled) {
      if (!nameFilled) errors.push('name')
      if (!amountFilled) errors.push('amount')
      hasPartial = true
    }
    row.errors = errors
  }
  if (hasPartial) {
    return
  }

  const validRows = rows.value.filter(
    (row) => isFilled(row.draft.name) && row.draft.amount > 0,
  )
  const unsavedRows = validRows.filter((row) => !row.saved)

  // No valid rows: the user chose to skip setup. That's allowed (AC10) — just
  // go home. The session's onboarding check already ran, so the guard won't
  // bounce them back here.
  if (validRows.length === 0) {
    committedStore.setHasAny(false)
    await router.push('/')
    return
  }

  // This can happen after a partial failure: all valid rows have since made it
  // to the server, and the user has pressed the CTA again.
  if (unsavedRows.length === 0) {
    committedStore.setHasAny(true)
    await router.push('/')
    return
  }

  saving.value = true
  const results = await Promise.allSettled(
    unsavedRows.map((row) =>
      createCommittedExpense({ ...row.draft, name: row.draft.name.trim() }),
    ),
  )
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      unsavedRows[index].saved = true
    }
  })

  try {
    if (results.every((result) => result.status === 'fulfilled')) {
      committedStore.setHasAny(true)
      await router.push('/')
      return
    }

    // Preserve successful rows so a retry only POSTs the rows that failed.
    if (results.some((result) => result.status === 'fulfilled')) {
      committedStore.setHasAny(true)
    }
    errorMessage.value = "Couldn't save — check your connection and try again."
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.onboarding {
  padding-top: var(--space-2xl);
}

.onboarding__intro {
  margin-top: var(--space-md);
  color: var(--lune-text-muted);
}

.onboarding__form {
  margin-top: var(--space-xl);
}

/* Shape comes from `.lune-add-row` in patterns.css. */
.onboarding__add {
  margin-top: var(--space-sm);
}

.onboarding__status {
  min-height: var(--space-lg);
  margin-top: var(--space-md);
}

.onboarding__error {
  color: rgb(var(--v-theme-error));
}

.onboarding__cta {
  min-height: 44px;
  margin-top: var(--space-xl);
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.01em;
}
</style>
