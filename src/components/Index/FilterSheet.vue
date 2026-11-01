<script setup lang="ts">
import { computed, ref, watch } from "vue";

import BookFilter from "./BookFilter.vue";
import { FilterRefs } from "./Filter";
import { normaliseLevel } from "./levels";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";

/**
 * The mobile filter sheet: anchored to the bottom edge, as tall as its content,
 * with the commit action pinned to the bottom carrying the live result count.
 * Choices are held as a draft and applied on commit — on a phone, filtering on
 * every tap re-renders the list underneath the sheet.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  filter: { type: FilterRefs, required: true },
})

const emit = defineEmits(["apply", "close"])

const draft = new FilterRefs()
// A touch that dismisses the sheet can produce a second click on the page
// underneath; ignore taps for a moment after opening.
const openedAt = ref(0)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    openedAt.value = Date.now()
    draft.level.value = props.filter.level.value
    draft.size.value = props.filter.size.value
    draft.author.value = props.filter.author.value
  },
  { immediate: true },
)

function onUpdate(value: { level: string; size: string; author: string }) {
  draft.level.value = value.level
  draft.size.value = value.size
  draft.author.value = value.author
}

const count = computed(() =>
  props.books.filter((book) =>
    draft.matches(
      normaliseLevel(book["Vocab Level"]),
      book.size ?? "",
      book.author,
    ),
  ).length,
)

const active = computed(
  () => [draft.level.value, draft.size.value, draft.author.value].filter(Boolean).length,
)

function onBackdrop() {
  if (Date.now() - openedAt.value < 300) return
  emit("close")
}

function clear() {
  draft.level.value = ""
  draft.size.value = ""
  draft.author.value = ""
}

function apply() {
  emit("apply", {
    level: draft.level.value,
    size: draft.size.value,
    author: draft.author.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click="onBackdrop" />
    <section
      v-if="open"
      class="sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      @keydown.esc="emit('close')">
      <span class="grabber" aria-hidden="true" />
      <header class="sheet__head">
        <h2 class="sheet__title">Filters</h2>
        <button type="button" class="sheet__close" aria-label="Close filters" @click="emit('close')">×</button>
      </header>

      <BookFilter :books="books" :filter="draft" @update-filter-value="onUpdate" />

      <footer class="sheet__foot">
        <button type="button" class="clear" :disabled="active === 0" @click="clear">Clear all</button>
        <va-button size="small" @click="apply">
          <span aria-live="polite">Show {{ count.toLocaleString("en-GB") }} books</span>
        </va-button>
      </footer>
    </section>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 35%);
  z-index: 40;
}
.sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 41;
  max-height: 92vh;
  overflow-y: auto;
  padding: .5rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  border-radius: 1rem 1rem 0 0;
  background: var(--va-background-primary, #fff);
  box-shadow: 0 -4px 24px rgb(0 0 0 / 18%);
}
.grabber {
  display: block;
  width: 2.5rem;
  height: .25rem;
  margin: .25rem auto .75rem;
  border-radius: 1rem;
  background: var(--va-divider, rgb(128 128 128 / 35%));
}
.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .75rem;
}
.sheet__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 500;
}
.sheet__close {
  border: 0;
  background: none;
  color: var(--va-text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  padding: .25rem .5rem;
  cursor: pointer;
}
/* The three controls stack, at their natural height: `flex: 1` is for the row
   layout on a desktop, and would stretch each field down the whole sheet. */
.sheet :deep(.field) {
  flex: 0 0 auto;
}
.sheet :deep(.filters) {
  align-items: stretch;
}
.sheet :deep(nav.row) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: .75rem;
  margin: 0;
}
.sheet :deep(.va-select) {
  width: 100%;
}
.sheet__foot {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-top: 1rem;
  padding-top: .75rem;
  border-top: 1px solid var(--va-divider, rgb(128 128 128 / 20%));
}
.clear {
  border: 0;
  background: none;
  padding: .5rem .25rem;
  color: var(--va-text-secondary);
  font: inherit;
  font-size: .9rem;
  text-decoration: underline;
  cursor: pointer;
}
.clear:disabled {
  color: var(--va-text-secondary);
  opacity: .4;
  text-decoration: none;
  cursor: default;
}
.sheet__foot :deep(.va-button) {
  margin-left: auto;
  min-height: 2.5rem;
}
</style>
