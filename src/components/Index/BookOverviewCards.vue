<script setup lang="ts">
import BookOverviewCard from "./BookOverviewCard.vue";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";

defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required:true}
})
</script>
<template>
  <div class="row flex">
    <template v-for="book in books" :key="book.author + ': ' + book.title">
      <BookOverviewCard 
        :lang="book.lang"
        :title="book.title" 
        :author="book.author" 
        :level="book['Vocab Level'] ?? ''"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :translated="book.translated === true || book.translated === 'true'" />
    </template>
  </div>
</template>

<style scoped>
.row {
  gap: 1rem;
}
</style>
