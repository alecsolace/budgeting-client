import { api } from './api'

// Wire shape returned by GET /api/committed-expenses (ASP.NET Core serializes
// CommittedExpenseDto as camelCase). `id` is always present on a response;
// it's optional only on the request body for a create.
export interface CommittedExpense {
  id: string
  name: string
  amount: number
  currency: string
  frequency: CommittedFrequency
  category: CommittedCategory
  active: boolean
}

export type CommittedFrequency = 'weekly' | 'monthly' | 'annual'
export type CommittedCategory =
  | 'housing'
  | 'subscription'
  | 'debt'
  | 'utility'
  | 'transport'
  | 'other'

export const FREQUENCY_OPTIONS: CommittedFrequency[] = ['weekly', 'monthly', 'annual']
export const CATEGORY_OPTIONS: CommittedCategory[] = [
  'housing',
  'subscription',
  'debt',
  'utility',
  'transport',
  'other',
]

// A monthly obligation spread across the weeks in an average month. DESIGN.md
// and issue #7 both specify 4.33 (52 weeks / 12 months).
export const WEEKS_PER_MONTH = 4.33

/**
 * Named starting points for onboarding.
 *
 * The hard part of listing your committed expenses is remembering what you pay
 * for, not typing it — so onboarding leads with recognition rather than recall.
 * Picking a preset also carries the category across, which is the only reason
 * the committed taxonomy survives first-run: asked to choose one themselves,
 * people leave every row on "other", and DESIGN.md is explicit that the
 * committed/discretionary distinction is a data-model requirement rather than
 * decoration.
 *
 * Deliberately not exhaustive. The list is a prompt for memory, and an
 * always-present blank line covers everything it misses.
 */
export interface CommittedPreset {
  name: string
  category: CommittedCategory
  frequency: CommittedFrequency
}

export const COMMITTED_PRESETS: CommittedPreset[] = [
  { name: 'Rent', category: 'housing', frequency: 'monthly' },
  { name: 'Electricity', category: 'utility', frequency: 'monthly' },
  { name: 'Phone', category: 'utility', frequency: 'monthly' },
  { name: 'Internet', category: 'utility', frequency: 'monthly' },
  { name: 'Netflix', category: 'subscription', frequency: 'monthly' },
  { name: 'Spotify', category: 'subscription', frequency: 'monthly' },
  { name: 'Gym', category: 'subscription', frequency: 'monthly' },
  { name: 'Car payment', category: 'transport', frequency: 'monthly' },
  { name: 'Insurance', category: 'other', frequency: 'monthly' },
  { name: 'Student loan', category: 'debt', frequency: 'monthly' },
  { name: 'Childcare', category: 'other', frequency: 'monthly' },
]

/** What one expense costs per week, whatever cadence it's billed on. */
export function weeklyEquivalent(amount: number, frequency: CommittedFrequency): number {
  if (!amount) return 0
  if (frequency === 'weekly') return amount
  if (frequency === 'annual') return amount / 52
  return amount / WEEKS_PER_MONTH
}

// Fields the row editor can change. Currency is stored but not user-editable in
// v1 (issue #7 "Out of Scope"), so it isn't part of the draft.
export interface CommittedExpenseDraft {
  name: string
  amount: number
  frequency: CommittedFrequency
  category: CommittedCategory
}

const RESOURCE = '/api/committed-expenses'

export async function listCommittedExpenses(): Promise<CommittedExpense[]> {
  const { data } = await api.get<CommittedExpense[]>(RESOURCE)
  return data
}

export async function createCommittedExpense(
  draft: CommittedExpenseDraft,
): Promise<CommittedExpense> {
  const { data } = await api.post<CommittedExpense>(RESOURCE, {
    ...draft,
    currency: 'USD',
    active: true,
  })
  return data
}

export async function updateCommittedExpense(
  id: string,
  draft: CommittedExpenseDraft,
): Promise<CommittedExpense> {
  const { data } = await api.put<CommittedExpense>(`${RESOURCE}/${id}`, {
    id,
    ...draft,
    currency: 'USD',
    active: true,
  })
  return data
}

export async function deleteCommittedExpense(id: string): Promise<void> {
  await api.delete(`${RESOURCE}/${id}`)
}
