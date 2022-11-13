<script setup lang="ts">
import { storageDemo } from '~/logic/storage'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-dark-200 dark:text-light-700 bg-light-300 dark:bg-dark-300 shadow-lg">
    <Logo />
    <h2>AIMT-UXT Client</h2>
    <p class="mt-2 opacity-80">
      Software de captura de dados de interação.
    </p>
    <button class="mt-5 px-5 py-1 bg-red-700 dark:bg-red-400 text-light mt-5 text-sm" @click="openOptionsPage">
      Opçoes
    </button>
    <p class="mt-2 opacity-40">
      v3.0
    </p>
  </main>
</template>
