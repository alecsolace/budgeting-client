<template>
  <v-app :theme="theme">
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const theme = ref('luneLight')
</script>
