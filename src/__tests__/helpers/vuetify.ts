import { createVuetify } from 'vuetify'
import { VApp, VContainer, VTextField, VBtn, VCard } from 'vuetify/components'
import { Ripple } from 'vuetify/directives'

export const vuetify = createVuetify({
  components: { VApp, VContainer, VTextField, VBtn, VCard },
  directives: { Ripple },
})
