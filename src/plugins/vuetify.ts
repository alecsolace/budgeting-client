import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { Ripple } from 'vuetify/directives'

// Contrast notes (WCAG 2.1 AA):
// - `primary` (#C17A4A) stays the brand terracotta for everything that does
//   NOT carry text: progress fill, focus rings, soft accents. DESIGN.md's whole
//   differentiation strategy rests on it.
// - `cta` is the same terracotta darkened to #A8623A (already in the palette as
//   primary-darken-1). White on #C17A4A is only 3.41:1; on #A8623A it is 4.69:1,
//   so every FILLED, text-carrying button renders on `cta` instead.
const luneLight = {
  dark: false,
  colors: {
    background: '#F5F0E8',
    surface: '#FDFAF4',
    primary: '#C17A4A',
    'primary-darken-1': '#A8623A',
    // Filled CTA surface — text-safe variant of the terracotta (4.69:1 w/ white).
    cta: '#A8623A',
    'on-cta': '#FFFFFF',
    error: '#9B4444',
    'on-background': '#2C2416',
    'on-surface': '#2C2416',
    'on-primary': '#FFFFFF',
  },
  variables: {
    'surface-raised': '#FFFFFF',
    // Was #8C7B6B — 3.59:1 on #F5F0E8, failed 4.5:1. #736353 gives 5.09:1.
    'text-muted': '#736353',
    'accent-soft': '#F0E0CC',
    committed: '#5C7A5C',
    'committed-soft': '#E8EFE8',
    'error-soft': '#F5E8E8',
    border: '#E2D9CC',
    'border-strong': '#C8B8A4',
    // Input boundaries are non-text UI components and need 3:1. border-strong
    // is only 1.94:1 against the white input fill, so inputs get their own
    // token rather than repurposing (and darkening) the divider colour.
    'border-input': '#9E8A6E',
  },
}

const luneDark = {
  dark: true,
  colors: {
    background: '#1C1812',
    surface: '#242018',
    primary: '#D4895A',
    'primary-darken-1': '#B96F41',
    cta: '#D4895A',
    'on-cta': '#1C1812',
    // Was #9B4444 (the light-mode wine) — 2.78:1 on #1C1812, so validation
    // errors were effectively unreadable. #E08A8A gives 6.87:1.
    error: '#E08A8A',
    'on-background': '#EDE8DF',
    'on-surface': '#EDE8DF',
    // White on #D4895A is 2.79:1; the warm near-black gives 6.33:1.
    'on-primary': '#1C1812',
  },
  variables: {
    'surface-raised': '#2E2A22',
    // Was #8A7E6E — 4.45:1, just under AA. #9A8E7C gives 5.50:1.
    'text-muted': '#9A8E7C',
    'accent-soft': '#3A2E22',
    committed: '#6A8F6A',
    'committed-soft': '#1E2A1E',
    'error-soft': '#2E1E1E',
    border: '#38321E',
    'border-strong': '#4A4030',
    // Input outlines are non-text UI boundaries, so WCAG 1.4.11 wants 3:1.
    // #6E6152 was only 2.38:1 against surface-raised #2E2A22; #8A7C64 gives 3.50:1.
    'border-input': '#8A7C64',
  },
}

export default createVuetify({
  directives: { Ripple },
  theme: {
    defaultTheme: 'luneLight',
    themes: { luneLight, luneDark },
  },
  defaults: {
    VTextField: { rounded: 'md', variant: 'outlined' },
    // Matches VTextField deliberately. Without this VSelect falls back to
    // Vuetify's `filled`, so a row mixing the two renders one field outlined
    // and the next filled — visible inconsistency inside a single component.
    VSelect: { rounded: 'md', variant: 'outlined' },
    VBtn: { rounded: 'md', variant: 'flat' },
    VCard: { rounded: 'md' },
  },
})
