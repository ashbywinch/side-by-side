<script setup lang="ts">
import { all_sizes } from '@/components/sizes';
import { FilterRefs } from '@/components/Index/Filter';
import { levelOptions, normaliseLevelFilter } from '@/components/Index/levels';
import { computed, ref, watch, type PropType } from 'vue';
import type { BookIndexEntry } from '@/types/corpus';

/**
 * The three filters, in one of two skins.
 *
 * `native` renders platform controls, used inside the mobile sheet: the
 * library's own dropdown teleports its list to <body> at z-index 1, which puts
 * it behind the sheet and makes every filter unusable on a phone. A native
 * select opens the OS picker and cannot be painted underneath anything.
 */
const props = defineProps({
  filter: { type:FilterRefs, default:null},
  books: { type: Array as PropType<BookIndexEntry[]>, required:true},
})

const shadowAuthor = ref(props.filter.author.value ?? "");
const shadowLevel = ref(normaliseLevelFilter(props.filter.level.value));
const shadowSize = ref(props.filter.size.value ?? "");

// Keep the visible selection in sync with route changes (back/forward, links).
watch(
  () => props.filter.level.value,
  (level) => {
    shadowLevel.value = normaliseLevelFilter(level);
  },
);

// Only levels that can match a book, in CEFR order, plus Unrated.
const levels = computed(() => levelOptions(props.books))
const authors = computed(() => Array.from(new Set(props.books.map(book => book.author))))

const sizes = computed(() => 
  [...all_sizes].map(size => size[0])) // just the name

const emit = defineEmits(["update-filter-value"])
function doEmit()
{
  emit("update-filter-value", { "level": normaliseLevelFilter(shadowLevel.value), "size":shadowSize.value, "author":shadowAuthor.value })
}

</script>
<template>

  <nav class="row">
    <va-select v-model="shadowLevel" :options="levels" text-by="text" value-by="value" label="Level" placeholder="Any level" clearable @update:model-value="doEmit"></va-select>
    <va-select v-model="shadowSize" :options="sizes" label="Size" placeholder="Any size" clearable @update:model-value="doEmit"></va-select>
    <va-select v-model="shadowAuthor" :options="authors" label="Author" placeholder="Any author" clearable autocomplete highlight-matched-text  @update:model-value="doEmit"></va-select>
  </nav>
</template>

<style scoped>
.row {
  gap: 1rem;
}
nav {
  margin: 1rem 0;
}
.field__control[type="search"] {
  background-image: none;
}
</style>
