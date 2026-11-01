<script setup lang="ts">
import { computed } from "vue";

import IndexPage from "@/pages/Index/IndexPage.vue";

// Dev-only comparison harness for the bookshelf presentation. Not shipped.
const props = defineProps({
  lang: { type: String, required: true },
  variant: { type: String, required: true },
})

const shelfLayout = computed(() => (props.variant === "a" ? "section" : "rail"));
const portrait = computed(() => props.variant === "c");
</script>

<template>
  <IndexPage :lang="lang" :shelf-layout="shelfLayout" :portrait="portrait" />
</template>
