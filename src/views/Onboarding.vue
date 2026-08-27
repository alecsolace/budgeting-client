<template>
  <v-container class="onboarding" max-width="640">
    <h1 class="text-week-title">Let's start with what you have to pay.</h1>
    <p class="text-body onboarding__intro">
      Rent, subscriptions, debt payments — the stuff that happens every month whether you want it to
      or not. Add what you can; you can change any of it later.
    </p>

    <CommittedPresetChips
      class="onboarding__chips"
      :used-names="usedNames"
      @pick="addFromPreset"
    />

    <form class="onboarding__form" novalidate @submit.prevent="finish">
      <!-- Settled entries, in the sage treatment DESIGN.md reserves for
           committed expenses. This is the same visual language the weekly log
           uses, so the list doubles as a preview of where these end up. -->
      <ul v-if="settled.length" class="onboarding__list">
        <li v-for="row in settled" :key="row.key" class="onboarding__settled">
          <div class="onboarding__settled-main">
            <span class="text-body onboarding__settled-name">{{ row.draft.name }}</span>
            <span class="text-meta onboarding__settled-meta">
              {{ row.draft.frequency }} · {{ row.draft.category }}
            </span>
          </div>

          <span class="text-amount onboarding__settled-amount">
            {{ formatCurrency(row.draft.amount) }}
          </span>

          <v-btn
            variant="text"
            icon="mdi-close"
            size="small"
            class="onboarding__remove"
            :aria-label="`Remove ${row.draft.name}`"
            @click="remove(row.key)"
          />
        </li>
      </ul>

      <!-- One open line, always present. Tapping a chip fills its name and
           focuses the amount, so the common path is numbers only; typing here
           directly covers anything the chips missed. -->
      <div class="onboarding__active" :class="{ 'onboarding__active--error': Boolean(activeError) }">
        <label class="onboarding__sr-only" for="onboarding-name">Expense name</label>
        <input
          id="onboarding-name"
          ref="nameInput"
          v-model="activeName"
          class="text-body onboarding__field onboarding__field--name"
          placeholder="What else?"
          autocomplete="off"
          @keydown.enter.prevent="commitActive"
        />

        <label class="onboarding__sr-only" for="onboarding-amount">Amount</label>
        <input
          id="onboarding-amount"
          ref="amountInput"
          v-model="activeAmount"
          class="text-amount onboarding__field onboarding__field--amount"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          @keydown.enter.prevent="commitActive"
          @blur="commitActive"
        />
      </div>

      <div class="onboarding__status" role="status" aria-live="polite">
        <p v-if="activeError" class="text-body onboarding__error">{{ activeError }}</p>
        <p v-else-if="errorMessage" class="text-body onboarding__error">{{ errorMessage }}</p>
        <p v-else-if="weeklyTotal > 0" class="text-meta onboarding__running">
          that's about {{ formatCurrency(weeklyTotal) }} a week so far
        </p>
      </div>

      <v-btn
        type="submit"
        color="cta"
        block
        class="lune-button onboarding__cta"
        :loading="saving"
        :aria-busy="saving ? 'true' : 'false'"
      >
        {{ settled.length ? "That's everything" : 'Skip for now' }}
      </v-btn>
    </form>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import CommittedPresetChips from '../components/CommittedPresetChips.vue'
import {
  createCommittedExpense,
  weeklyEquivalent,
  type CommittedExpenseDraft,
  type CommittedPreset,
} from '../services/committedExpenses'
import { useCommittedExpensesStore } from '../stores/committedExpenses'

const router = useRouter()
const committedStore = useCommittedExpensesStore()

interface SettledRow {
  key: number
  draft: CommittedExpenseDraft
  // A fulfilled create is remembered so a retry after a partial failure never
  // duplicates a row that already reached the server.
  saved: boolean
}

let nextKey = 0

const settled = ref<SettledRow[]>([])
const saving = ref(false)
const errorMessage = ref('')
const activeError = ref('')

// The open line. Category and frequency ride along from whichever chip filled
// it, and fall back to the same defaults the API uses.
const activeName = ref('')
const activeAmount = ref('')
const activeCategory = ref<CommittedExpenseDraft['category']>('other')
const activeFrequency = ref<CommittedExpenseDraft['frequency']>('monthly')

const nameInput = ref<HTMLInputElement | null>(null)
const amountInput = ref<HTMLInputElement | null>(null)

const usedNames = computed(() => settled.value.map((row) => row.draft.name))

const weeklyTotal = computed(() =>
  settled.value.reduce(
    (total, row) => total + weeklyEquivalent(row.draft.amount, row.draft.frequency),
    0,
  ),
)

// Grouped thousands: these sit in a DM Mono tabular column, and "$1200.00"
// takes a beat longer to read as twelve hundred than "$1,200.00" does.
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function resetActive() {
  activeName.value = ''
  activeAmount.value = ''
  activeCategory.value = 'other'
  activeFrequency.value = 'monthly'
}

async function addFromPreset(preset: CommittedPreset) {
  // Anything already typed is banked first, so tapping a chip mid-entry never
  // silently discards it.
  commitActive()

  activeName.value = preset.name
  activeCategory.value = preset.category
  activeFrequency.value = preset.frequency
  activeError.value = ''

  // The name is already known, so the only thing left to say is the number.
  await nextTick()
  amountInput.value?.focus()
}

/**
 * Moves the open line into the settled list when it holds a complete entry.
 *
 * Silent about a blank line (nothing was asked for) and about a name with no
 * amount yet (the person is mid-entry — Login.vue's comment puts it well:
 * this product does not do punitive). It only speaks up for an amount with no
 * name, which cannot be saved and would otherwise vanish without explanation.
 */
function commitActive(): boolean {
  const name = activeName.value.trim()
  const amount = Number.parseFloat(activeAmount.value)
  const hasAmount = Number.isFinite(amount) && amount > 0

  if (!name && !hasAmount) {
    activeError.value = ''
    return false
  }

  if (!name) {
    activeError.value = 'What should we call this one?'
    return false
  }

  if (!hasAmount) {
    return false
  }

  settled.value.push({
    key: nextKey++,
    draft: {
      name,
      amount,
      frequency: activeFrequency.value,
      category: activeCategory.value,
    },
    saved: false,
  })

  activeError.value = ''
  resetActive()
  return true
}

function remove(key: number) {
  settled.value = settled.value.filter((row) => row.key !== key)
}

async function finish() {
  if (saving.value) {
    return
  }

  // A part-typed line at submit time counts as intent to include it.
  commitActive()
  if (activeError.value) {
    return
  }

  errorMessage.value = ''

  // Nothing entered is a legitimate outcome, not a failure state (issue #7
  // AC10). The session's onboarding check is already settled, so the guard
  // won't bounce them straight back here.
  if (settled.value.length === 0) {
    committedStore.setHasAny(false)
    await router.push('/')
    return
  }

  const unsaved = settled.value.filter((row) => !row.saved)
  if (unsaved.length === 0) {
    committedStore.setHasAny(true)
    await router.push('/')
    return
  }

  saving.value = true
  const results = await Promise.allSettled(
    unsaved.map((row) => createCommittedExpense(row.draft)),
  )
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      unsaved[index].saved = true
    }
  })

  try {
    if (results.every((result) => result.status === 'fulfilled')) {
      committedStore.setHasAny(true)
      await router.push('/')
      return
    }

    if (results.some((result) => result.status === 'fulfilled')) {
      committedStore.setHasAny(true)
    }
    // The rows stay on screen and the saved ones are marked, so pressing again
    // retries only what failed. Nothing typed is ever thrown away.
    errorMessage.value = "Couldn't save everything — we kept what you entered. Try again?"
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

.onboarding__chips {
  margin-top: var(--space-xl);
}

.onboarding__form {
  margin-top: var(--space-xl);
}

.onboarding__list {
  margin: 0 0 var(--space-sm);
  padding: 0;
  list-style: none;
}

/* Settled rows and the open entry row share one grid track list so the amount
   column lines up between them: name | amount | remove-button gutter. The open
   row leaves the third column empty. */
.onboarding__settled {
  display: grid;
  /* Columns collapse gracefully on narrow screens so the name never loses room
     to a fixed amount column — the meta line ("monthly · subscription") stays
     on one line at 375px. */
  grid-template-columns:
    minmax(0, 1fr)
    clamp(92px, 24vw, 140px)
    clamp(28px, 8vw, 40px);
  align-items: center;
  gap: clamp(var(--space-sm), 3vw, var(--space-md));
  padding: clamp(var(--space-sm), 3vw, var(--space-md));
  margin-bottom: var(--space-sm);
  background: var(--lune-committed-soft);
  border-radius: var(--radius-md);
}

.onboarding__settled-main {
  min-width: 0;
}

.onboarding__settled-name {
  display: block;
  line-height: 1.3;
}

.onboarding__settled-meta {
  display: block;
  margin-top: var(--space-2xs);
  font-size: 11px;
  color: var(--lune-text-muted);
}

.onboarding__settled-amount {
  /* Right-aligned in its own grid column so the numbers form a clean vertical
     line with the open entry row below. */
  text-align: right;
  font-size: 15px;
  font-weight: 500;
}

.onboarding__remove {
  justify-self: center;
  color: var(--lune-text-muted);
}

/* The one open line. White on linen, so it reads as the live edge of the
   page against the settled sage rows above it. */
.onboarding__active {
  display: grid;
  /* Same track list as .onboarding__settled so "0.00" lines up under the settled
     amounts. The trailing column stays empty — it reserves the remove-button
     gutter. */
  grid-template-columns:
    minmax(0, 1fr)
    clamp(92px, 24vw, 140px)
    clamp(28px, 8vw, 40px);
  gap: clamp(var(--space-sm), 3vw, var(--space-md));
  padding: clamp(var(--space-sm), 3vw, var(--space-md));
  background: var(--lune-surface-raised);
  border: 1px solid var(--lune-border-input);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-short) var(--ease-move);
}

.onboarding__active:focus-within {
  border-color: rgb(var(--v-theme-primary));
}

.onboarding__active--error {
  border-color: rgb(var(--v-theme-error));
}

.onboarding__field {
  min-height: 44px;
  padding: 0 var(--space-sm);
  color: rgb(var(--v-theme-on-background));
  background: transparent;
  border: 0;
  outline: none;
}

.onboarding__field--amount {
  text-align: right;
}

.onboarding__field::placeholder {
  color: var(--lune-text-muted);
  opacity: 0.75;
}

.onboarding__status {
  min-height: var(--space-lg);
  margin-top: var(--space-sm);
}

.onboarding__running {
  text-align: right;
  color: var(--lune-text-muted);
}

.onboarding__error {
  color: rgb(var(--v-theme-error));
}

.onboarding__cta {
  min-height: 44px;
  margin-top: var(--space-lg);
  font-size: 16px;
}

.onboarding__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
