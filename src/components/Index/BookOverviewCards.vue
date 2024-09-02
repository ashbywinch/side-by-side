<script setup lang="ts">
import BookOverviewCard from "./BookOverviewCard.vue";

defineProps({
  books: { type:Array<Map<string, string>>, required:true}
})
</script>
<template>
  <div class="row flex">
    <template v-for="book in books" :key="book.author + ': ' + book.title">
      <BookOverviewCard 
        :lang="book.lang"
        :title="book.title" 
        :author="book.author" 
        :level="book['Vocab Level']"
        :words="book['Word Count']"
        :size="book.size ?? ''" />
    </template>
  </div>
</template>

<style scoped>
.row {
  gap: 1rem;
}
</style>
