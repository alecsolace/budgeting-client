import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommittedPresetChips from '../components/CommittedPresetChips.vue'

function chipNamed(wrapper: ReturnType<typeof mount>, label: string) {
  const chip = wrapper.findAll('button').find((button) => button.text().trim() === label)
  if (!chip) throw new Error(`no chip labelled "${label}"`)
  return chip
}

describe('CommittedPresetChips', () => {
  it('marks used names case-insensitively after trimming input', () => {
    const wrapper = mount(CommittedPresetChips, {
      props: { usedNames: ['  rent  '] },
    })

    expect(chipNamed(wrapper, 'Rent').attributes('aria-pressed')).toBe('true')
    expect(chipNamed(wrapper, 'Gym').attributes('aria-pressed')).toBe('false')
  })

  it('does not emit a pick from a disabled chip', async () => {
    const wrapper = mount(CommittedPresetChips, {
      props: { usedNames: [], disabled: true },
    })

    const rent = chipNamed(wrapper, 'Rent')
    expect(rent.attributes('disabled')).toBeDefined()
    await rent.trigger('click')

    expect(wrapper.emitted('pick')).toBeUndefined()
  })
})
