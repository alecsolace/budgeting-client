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
