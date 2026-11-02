<script setup lang="ts">
import { computed, ref } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import { useCardMinWidth } from "./useCardMinWidth";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const VISIBLE = 3;

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
  lang: { type: String, default: "ru" },
})

const cards = computed(() => shelfCards(props.books, props.entries))
const shown = computed(() => cards.value.slice(0, VISIBLE))

const stack = ref<HTMLElement | null>(null)
const minWidth = useCardMinWidth(stack)
</script>

<template>
  <section v-if="cards.length" class="shelf" aria-label="You are reading">
    <h2 class="shelf__title">
      You&rsquo;re reading&hellip;
      <RouterLink
        v-if="cards.length > VISIBLE"
        class="see-all"
        :to="{ name: 'Shelf', params: { lang } }">
        See all {{ cards.length }} books
      </RouterLink>
    </h2>
    <div
      ref="stack"
      class="stack"
      :style="minWidth ? { '--card-min': `${minWidth}px` } : undefined">
      <BookOverviewCard
        v-for="{ book, entry } in shown"
        :key="book.author + ': ' + book.title"
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="progressFraction(entry)" />
    </div>
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 .5rem;
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
.stack > * {
  min-width: 0;
}
.see-all {
  margin-left: .5rem;
  font-size: .85rem;
  font-weight: 400;
}
.see-all:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}
</style>
