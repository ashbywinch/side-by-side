<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

import { saveBookshelf, STORAGE_KEY } from "@/components/Bookshelf/bookshelfStorage";
import IndexPage from "@/pages/Index/IndexPage.vue";
import { layoutFor, rememberVariant, isLabVariant } from "./labVariant";
import { shelfFor } from "./shelfFixtures";

const route = useRoute();

// `?shelf=none|reading|full|stale` sets the bookshelf before the app reads it.
// A fresh browser context already starts empty; this is for comparing the
// variants with the identical shelf, and for resetting between looks.
const requested = typeof route.query.shelf === "string" ? route.query.shelf : null;
if (requested !== null) {
  const shelf = shelfFor(requested);
  if (shelf) saveBookshelf(window.localStorage, shelf);
  else window.localStorage.removeItem(STORAGE_KEY);
}

// Dev-only comparison harness for the bookshelf presentation. Not shipped.
const props = defineProps({
  lang: { type: String, required: true },
  variant: { type: String, required: true },
})

const layout = computed(() =>
  layoutFor(isLabVariant(props.variant) ? props.variant : "b"),
);
const shelfLayout = computed(() => layout.value.shelfLayout);
const portrait = computed(() => layout.value.portrait);

// Opening a book leaves the lab route; the index they come back to must still
// show the same presentation.
onMounted(() => rememberVariant(props.variant));
</script>

<template>
  <IndexPage :lang="lang" :shelf-layout="shelfLayout" :portrait="portrait" />
</template>
