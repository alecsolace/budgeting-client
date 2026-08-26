import { describe, it, expect } from 'vitest'
import vuetify from '../plugins/vuetify'

// These are measured WCAG 2.1 AA fixes, not taste. Pinning the hex values keeps
// a later "tidy-up" from quietly reintroducing an unreadable state.
function relativeLuminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const [r, g, b] = channels.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const themes = vuetify.theme.themes.value
const light = themes.luneLight
const dark = themes.luneDark

describe('contrast helper', () => {
  it('agrees with the known black/white extreme', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })
})

describe('luneLight', () => {
  it('keeps the brand terracotta as `primary` for non-text use', () => {
    expect(light.colors.primary).toBe('#C17A4A')
  })

  it('renders filled CTA text on a darker terracotta that clears 4.5:1', () => {
    expect(light.colors.cta).toBe('#A8623A')
    expect(contrast(light.colors['on-cta'], light.colors.cta)).toBeGreaterThanOrEqual(4.5)
    // The guard on the whole exercise: white on the un-darkened primary fails.
    expect(contrast('#FFFFFF', light.colors.primary)).toBeLessThan(4.5)
  })

  it('gives muted text at least 4.5:1 on the linen background', () => {
    expect(contrast(light.variables['text-muted'] as string, light.colors.background)).toBeGreaterThanOrEqual(4.5)
  })

  it('gives input borders at least the 3:1 required of UI component boundaries', () => {
    expect(contrast(light.variables['border-input'] as string, '#FFFFFF')).toBeGreaterThanOrEqual(3)
    // border-strong stays the quiet divider colour; it is not a border-input.
    expect(light.variables['border-strong']).toBe('#C8B8A4')
  })

  it('gives error text at least 4.5:1', () => {
    expect(contrast(light.colors.error, light.colors.background)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('luneDark', () => {
  it('puts warm near-black, not white, on the dark primary', () => {
    expect(dark.colors['on-primary']).toBe('#1C1812')
    expect(contrast(dark.colors['on-primary'], dark.colors.primary)).toBeGreaterThanOrEqual(4.5)
  })

  it('gives muted text at least 4.5:1', () => {
    expect(contrast(dark.variables['text-muted'] as string, dark.colors.background)).toBeGreaterThanOrEqual(4.5)
  })

  it('no longer reuses the light-mode wine for errors', () => {
    expect(dark.colors.error).not.toBe('#9B4444')
    expect(contrast(dark.colors.error, dark.colors.background)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps CTA text readable', () => {
    expect(contrast(dark.colors['on-cta'], dark.colors.cta)).toBeGreaterThanOrEqual(4.5)
  })

  it('stays warm rather than cool-grey', () => {
    expect(dark.colors.background).toBe('#1C1812')
  })
})
