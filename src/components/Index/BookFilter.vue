<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { all_sizes } from "@/components/sizes";
import { FilterRefs } from "@/components/Index/Filter";
import { levelOptions, normaliseLevelFilter } from "@/components/Index/levels";
import SelectField from "@/components/Index/SelectField.vue";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";

const props = defineProps({
  filter: { type: FilterRefs, default: null },
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
})

const emit = defineEmits(["update-filter-value"])

const shadowLevel = ref<string>(normaliseLevelFilter(props.filter.level.value))
const shadowSize = ref(props.filter.size.value ?? "")
const shadowAuthor = ref(props.filter.author.value ?? "")

// Keep the visible selection in sync with route changes (back/forward, links).
watch(
  () => props.filter.level.value,
  (level) => {
    shadowLevel.value = normaliseLevelFilter(level)
  },
)
watch(
  () => props.filter.author.value,
  (author) => {
    shadowAuthor.value = author
  },
)

const levels = computed(() =>
  levelOptions(props.books).map((level) => ({ label: level.text, value: level.value })),
)
const sizes = computed(() =>
  [...all_sizes].map((size) => ({ label: size[0], value: size[0] })),
)
// Sorted by surname: a catalogue sorted by first name puts "Лев Толстой" under Л.
const authors = computed(() =>
  Array.from(new Set(props.books.map((book) => book.author)))
    .sort((a, b) => {
      const surname = (name: string) => name.trim().split(/\s+/).pop() ?? name
      return surname(a).localeCompare(surname(b), "ru")
    })
    .map((author) => ({ label: author, value: author })),
)

function emitFilter() {
  emit("update-filter-value", {
    level: normaliseLevelFilter(shadowLevel.value),
    size: shadowSize.value,
    author: shadowAuthor.value,
  })
}

function setLevel(value: string) {
  shadowLevel.value = value
  emitFilter()
}

function setSize(value: string) {
  shadowSize.value = value
  emitFilter()
}

function setAuthor(value: string) {
  shadowAuthor.value = value
  emitFilter()
}
</script>
<template>
  <nav class="row filters">
    <SelectField
      label="Level"
      placeholder="Any level"
      :model-value="shadowLevel"
      :options="levels"
      @update:model-value="setLevel" />
    <SelectField
      label="Size"
      placeholder="Any size"
      :model-value="shadowSize"
      :options="sizes"
      @update:model-value="setSize" />
    <SelectField
      label="Author"
      placeholder="Any author"
      searchable
      :model-value="shadowAuthor"
      :options="authors"
      @update:model-value="setAuthor" />
  </nav>
</template>

<style scoped>
.filters {
  gap: 1rem;
  align-items: flex-start;
}
</style>
