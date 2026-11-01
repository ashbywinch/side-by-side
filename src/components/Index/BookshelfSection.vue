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
  <section v-if="cards.length" class="shelf" aria-label="You are reading">
    <header class="shelf__head">
      <h2 class="shelf__title">You&rsquo;re reading&hellip;</h2>
      <RouterLink
        v-if="cards.length > VISIBLE"
        class="see-all"
        :to="{ name: 'Shelf', params: { lang } }">
        See all {{ cards.length }}
      </RouterLink>
    </header>
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
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1.5rem;
}
.shelf__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .5rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
.stack {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: .75rem;
  align-items: stretch;
}
.stack > * {
  min-width: 0;
}
.see-all {
  font-size: .85rem;
  white-space: nowrap;
  min-height: 2rem;
  display: inline-flex;
  align-items: center;
}
</style>
