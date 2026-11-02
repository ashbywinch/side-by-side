<script setup lang="ts">
import { computed, ref } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards, type ShelfBook } from "./shelfCards";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import { useCardMinWidth } from "./useCardMinWidth";
import { useRemoveTop } from "./useRemoveTop";
import { useShelfEditing } from "./useShelfEditing";
import { useShelfExpansion } from "./useShelfExpansion";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
})

const emit = defineEmits<{
  remove: [book: ShelfBook]
  restore: [book: ShelfBook]
}>()

const cards = computed(() => shelfCards(props.books, props.entries))

const stack = ref<HTMLElement | null>(null)
const section = ref<HTMLElement | null>(null)
const headerToggle = ref<HTMLButtonElement | null>(null)
const bottomCollapse = ref<HTMLButtonElement | null>(null)
const editToggle = ref<HTMLButtonElement | null>(null)

const minWidth = useCardMinWidth(stack)
const {
  preview,
  isExpanded,
  shown,
  remaining,
  nextStep,
  toggle,
  showMore,
  collapse,
  reveal,
} = useShelfExpansion(cards, section, headerToggle, bottomCollapse)
const removeOffset = useRemoveTop(stack, minWidth, () => shown.value.length)
const stackStyle = computed(() => ({
  ...(minWidth.value ? { "--card-min": `${minWidth.value}px` } : {}),
  ...(removeOffset.value ? { "--remove-top": `${removeOffset.value}px` } : {}),
}))

const { editing, removed, toggleEditing, remove } = useShelfEditing({
  cards,
  shown,
  section,
  editToggle,
  reveal,
  onRemove: (book) => emit("remove", book),
  onRestore: (book) => emit("restore", book),
})
</script>

<template>
  <section
    v-if="cards.length || editing"
    ref="section"
    class="shelf"
    :class="{ 'shelf--undo': removed.length }"
    aria-labelledby="shelf-title">
    <div class="shelf__head">
      <h2 id="shelf-title" class="shelf__title">You&rsquo;re reading&hellip;</h2>
      <div class="shelf__actions">
        <button
          v-if="cards.length > preview"
          ref="headerToggle"
          type="button"
          class="text-action shelf__toggle"
          :aria-expanded="isExpanded"
          aria-controls="shelf-grid"
          @click="toggle">
          {{ isExpanded ? "Show less" : `See all ${cards.length} books` }}
        </button>
        <button
          v-if="cards.length > 0 || editing"
          ref="editToggle"
          type="button"
          class="text-action shelf__edit"
          @click="toggleEditing">
          {{ editing ? "Done" : "Edit" }}
        </button>
      </div>
    </div>

    <p v-if="!cards.length" class="shelf__empty">Your shelf is empty.</p>
    <div
      v-else
      id="shelf-grid"
      ref="stack"
      class="stack"
      :style="stackStyle">
      <BookOverviewCard
        v-for="({ book, entry }, index) in shown"
        :key="book.author + ': ' + book.title"
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="progressFraction(entry)"
        :editing="editing"
        @remove="remove(book, index)" />
    </div>

    <div v-if="isExpanded" class="shelf__foot">
      <button
        v-if="remaining > 0"
        type="button"
        class="text-action shelf__more"
        @click="showMore">
        Show {{ nextStep }} more
      </button>
      <button
        ref="bottomCollapse"
        type="button"
        class="text-action shelf__collapse"
        @click="collapse">
        Show less
      </button>
    </div>
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1rem;
  scroll-margin-top: 1rem;
}
/* The undo bar is fixed to the viewport; leave room under the last row and the
   collapse controls so it never covers them. */
.shelf--undo {
  padding-bottom: 5rem;
}
.shelf__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .25rem .75rem;
  margin-bottom: .5rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
.shelf__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .25rem .75rem;
  margin-left: auto;
}
.shelf__empty {
  margin: 0 0 .5rem;
  color: var(--va-text-secondary);
}
.text-action {
  min-height: 2.75rem;
  padding: .25rem 0;
  border: 0;
  background: none;
  color: var(--va-primary);
  font: inherit;
  font-size: .85rem;
  font-weight: 400;
  cursor: pointer;
}
.text-action:hover {
  text-decoration: underline;
}
.text-action:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}
.shelf__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: .25rem 1.5rem;
  margin-top: .75rem;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 1rem;
}
.stack > * {
  flex: 0 0 auto;
  min-width: 0;
}
/* A pointer does not need the phone-sized hit area; keep the header quiet on a
   desktop while leaving the 44px target on touch. */
@media (pointer: fine) {
  .text-action {
    min-height: auto;
    padding-block: .1rem;
  }
}
</style>
