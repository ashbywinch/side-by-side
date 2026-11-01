<script setup lang="ts">
import { computed } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const VISIBLE = 3;

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
  portrait: { type: Boolean, default: true },
  lang: { type: String, default: "ru" },
})

const cards = computed(() => shelfCards(props.books, props.entries))
const shown = computed(() => cards.value.slice(0, VISIBLE))
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
    <div class="stack">
      <BookOverviewCard
        v-for="{ book, entry } in shown"
        :key="book.author + ': ' + book.title"
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="progressFraction(entry)"
        :portrait="portrait" />
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
  display: grid;
  grid-template-columns: repeat(auto-fill, 7rem);
  justify-content: start;
  gap: .75rem;
  align-items: start;
}
.screen-xs .stack {
  gap: .5rem;
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
