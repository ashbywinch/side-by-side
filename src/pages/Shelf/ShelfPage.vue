<script setup lang="ts">
import { computed, watchEffect } from "vue";

import BookOverviewCards from "@/components/Index/BookOverviewCards.vue";
import { shelfCards } from "@/components/Index/shelfCards";
import { useBookshelf } from "@/components/Bookshelf/useBookshelf";
import PageSurround from "@/components/PageSurround.vue";
import { useFetchIndexItems } from "@/pages/Index/FetchIndex";

const props = defineProps({
  lang: { type: String, default: "ru" },
})

const fetchItems = useFetchIndexItems(props.lang)
watchEffect(() => fetchItems.fetch())

const bookshelf = useBookshelf()
const shelf = computed(() =>
  shelfCards(fetchItems.items.value, bookshelf.entries.value).map((card) => card.book),
)
</script>

<template>
  <PageSurround :error="fetchItems.error.value">
    <h1 class="title">You&rsquo;re reading&hellip;</h1>
    <p v-if="!fetchItems.is_loading.value && bookshelf.entries.value.length === 0" class="empty">
      Nothing here yet. A book joins your bookshelf when you reveal a translation
      or turn a page in it.
      <RouterLink :to="{ name: 'Index', params: { lang } }">Browse the library</RouterLink>.
    </p>
    <BookOverviewCards
      v-else
      :books="shelf"
      :entries="bookshelf.entries.value"
      />
  </PageSurround>
</template>

<style scoped>
.title {
  font-size: 1.4rem;
  font-weight: 400;
  margin: 0 0 1rem;
}
.empty {
  max-width: 34rem;
}
</style>
