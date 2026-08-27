<template>
  <v-container class="settings-committed" max-width="640">
    <RouterLink to="/" class="settings-committed__back text-body">← Weekly log</RouterLink>

    <h1 class="text-display settings-committed__title">Committed expenses</h1>
    <p class="text-body settings-committed__subtext">
      These appear in your weekly log every week.
    </p>

    <div class="settings-committed__status" role="status" aria-live="polite">
      <p v-if="errorMessage" class="text-body settings-committed__error">{{ errorMessage }}</p>
    </div>

    <div class="settings-committed__list">
      <CommittedExpenseRow
        v-for="(row, index) in rows"
        :key="row.key"
        v-model="row.draft"
        deletable
        @blur="handleBlur(index)"
        @delete="handleDelete(index)"
      />

      <p
        v-if="!loading && !errorMessage && rows.length === 0"
        class="text-body settings-committed__empty"
      >
        No committed expenses. Add one above.
      </p>
    </div>

    <button type="button" class="lune-add-row settings-committed__add lune-button" @click="addRow">
      + Add expense
    </button>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CommittedExpenseRow from '../components/CommittedExpenseRow.vue'
import {
  createCommittedExpense,
  deleteCommittedExpense,
  listCommittedExpenses,
  updateCommittedExpense,
  type CommittedExpenseDraft,
} from '../services/committedExpenses'
import { useCommittedExpensesStore } from '../stores/committedExpenses'

const committedStore = useCommittedExpensesStore()

interface EditableRow {
  key: number
  // null until the row has been persisted (a freshly added row).
  id: string | null
  draft: CommittedExpenseDraft
  // Snapshot of the last persisted state, to skip no-op PUTs on blur.
  saved: string
  // Serialise writes per row. A second blur while a request is running is
  // queued, avoiding duplicate POSTs and out-of-order PUTs.
  savePromise: Promise<void> | null
  saveQueued: boolean
  deleted: boolean
}

let nextKey = 0

const rows = ref<EditableRow[]>([])
const loading = ref(true)
const errorMessage = ref('')

function snapshot(draft: CommittedExpenseDraft): string {
  return JSON.stringify(draft)
}

function emptyDraft(): CommittedExpenseDraft {
  return { name: '', amount: 0, frequency: 'monthly', category: 'other' }
}

onMounted(async () => {
  try {
    const expenses = await listCommittedExpenses()
    rows.value = expenses.map((expense) => {
      const draft: CommittedExpenseDraft = {
        name: expense.name,
        amount: expense.amount,
        frequency: expense.frequency,
        category: expense.category,
      }
      return {
        key: nextKey++,
        id: expense.id,
        draft,
        saved: snapshot(draft),
        savePromise: null,
        saveQueued: false,
        deleted: false,
      }
    })
    committedStore.setHasAny(rows.value.length > 0)
  } catch {
    errorMessage.value = "Couldn't load your committed expenses. Refresh to try again."
  } finally {
    loading.value = false
  }
})

function addRow() {
  const draft = emptyDraft()
  rows.value.push({
    key: nextKey++,
    id: null,
    draft,
    saved: snapshot(draft),
    savePromise: null,
    saveQueued: false,
    deleted: false,
  })
}

function handleBlur(index: number) {
  const row = rows.value[index]
  if (!row || row.deleted) {
    return
  }

  if (row.savePromise) {
    row.saveQueued = true
    return
  }

  row.savePromise = persistRow(row).finally(() => {
    row.savePromise = null
    if (row.saveQueued && !row.deleted) {
      row.saveQueued = false
      persistQueuedRow(row)
    }
  })
}

function persistQueuedRow(row: EditableRow) {
  if (row.savePromise || row.deleted) {
    return
  }
  row.savePromise = persistRow(row).finally(() => {
    row.savePromise = null
    if (row.saveQueued && !row.deleted) {
      row.saveQueued = false
      persistQueuedRow(row)
    }
  })
}

async function persistRow(row: EditableRow) {
  const current = snapshot(row.draft)
  if (current === row.saved) {
    return
  }

  const hasName = row.draft.name.trim().length > 0

  // A new row is only worth creating once it has a name (issue #7 AC8).
  if (row.id === null && !hasName) {
    return
  }

  const payload: CommittedExpenseDraft = { ...row.draft, name: row.draft.name.trim() }

  try {
    errorMessage.value = ''
    if (row.id === null) {
      const created = await createCommittedExpense(payload)
      row.id = created.id
      if (!row.deleted) {
        committedStore.setHasAny(true)
      }
    } else {
      await updateCommittedExpense(row.id, payload)
    }
    // Store exactly what was sent. In particular, this prevents a trimmed
    // name from looking dirty forever after it has been persisted.
    row.draft = payload
    row.saved = snapshot(payload)
  } catch {
    errorMessage.value = "Couldn't save that change — check your connection and try again."
  }
}

async function handleDelete(index: number) {
  const row = rows.value[index]
  if (!row) {
    return
  }

  // Remove from the DOM immediately, no confirmation (issue #7 AC7).
  row.deleted = true
  rows.value.splice(index, 1)
  if (rows.value.length === 0) {
    committedStore.setHasAny(false)
  }

  // If a field was just blurred, make the DELETE follow its in-flight POST or
  // PUT. Otherwise a late PUT could reactivate an expense after the delete.
  await row.savePromise
  if (row.id === null) {
    return
  }

  try {
    await deleteCommittedExpense(row.id)
  } catch {
    errorMessage.value = "Couldn't delete that one — it may reappear on refresh."
  }
}
</script>

<style scoped>
.settings-committed {
  padding-top: var(--space-xl);
}

.settings-committed__back {
  display: inline-block;
  margin-bottom: var(--space-lg);
  font-size: 14px;
  color: var(--lune-text-muted);
  text-decoration: none;
}

.settings-committed__back:hover {
  text-decoration: underline;
}

.settings-committed__subtext {
  margin-top: var(--space-xs);
  color: var(--lune-text-muted);
}

.settings-committed__status {
  min-height: var(--space-lg);
  margin-top: var(--space-sm);
}

.settings-committed__error {
  color: rgb(var(--v-theme-error));
}

.settings-committed__list {
  margin-top: var(--space-md);
}

.settings-committed__empty {
  padding: var(--space-lg) 0;
  color: var(--lune-text-muted);
}

/* Shape comes from `.lune-add-row` in patterns.css. */
.settings-committed__add {
  margin-top: var(--space-md);
}
</style>
