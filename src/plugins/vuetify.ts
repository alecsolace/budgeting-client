import 'vuetify/styles'
import { createVuetify } from 'vuetify'

const luneLight = {
  dark: false,
  colors: {
    background:          '#F5F0E8',
    surface:             '#FDFAF4',
    primary:             '#C17A4A',
    'primary-darken-1':  '#A8623A',
    error:               '#9B4444',
    'on-background':     '#2C2416',
    'on-surface':        '#2C2416',
    'on-primary':        '#FFFFFF',
  },
  variables: {
    'surface-raised':  '#FFFFFF',
    'text-muted':      '#8C7B6B',
    'accent-soft':     '#F0E0CC',
    'committed':       '#5C7A5C',
    'committed-soft':  '#E8EFE8',
    'error-soft':      '#F5E8E8',
    'border':          '#E2D9CC',
    'border-strong':   '#C8B8A4',
  },
}

const luneDark = {
  dark: true,
  colors: {
    background:      '#1C1812',
    surface:         '#242018',
    primary:         '#D4895A',
    error:           '#9B4444',
    'on-background': '#EDE8DF',
    'on-surface':    '#EDE8DF',
    'on-primary':    '#FFFFFF',
  },
  variables: {
    'surface-raised': '#2E2A22',
    'text-muted':     '#8A7E6E',
    'accent-soft':    '#3A2E22',
    'committed':      '#6A8F6A',
    'committed-soft': '#1E2A1E',
    'border':         '#38321E',
    'border-strong':  '#4A4030',
  },
}

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'luneLight',
    themes: { luneLight, luneDark },
  },
  defaults: {
    VTextField: { rounded: 'md', variant: 'outlined' },
    VBtn:       { rounded: 'md', variant: 'flat' },
    VCard:      { rounded: 'md' },
  },
})
