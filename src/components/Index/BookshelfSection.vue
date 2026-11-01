<script setup lang="ts">
import { computed } from "vue";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { isFinished, progressFraction } from "@/components/Bookshelf/bookshelf";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { BookshelfEntry } from "@/types/bookshelf";

const VISIBLE = 4;

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
  portrait: { type: Boolean, default: false },
  lang: { type: String, default: "ru" },
})

const cards = computed(() => shelfCards(props.books, props.entries))
const shown = computed(() => cards.value.slice(0, VISIBLE))
</script>

<template>
  <section v-if="cards.length" class="shelf" aria-label="Your books">
    <h2 class="shelf__title">Your books</h2>
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
        :finished="isFinished(entry)"
        :portrait="portrait" />
    </div>
    <RouterLink
      v-if="cards.length > VISIBLE"
      class="see-all"
      :to="{ name: 'Shelf', params: { lang } }">
      See all {{ cards.length }} books
    </RouterLink>
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1.5rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 .5rem;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.see-all {
  display: inline-block;
  margin-top: .5rem;
  font-size: .9rem;
}
</style>
