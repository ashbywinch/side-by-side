<script setup lang="ts">

  defineProps({
    data: { type:Object, default:null },
    test: { type:String, default:"" },

  })
</script>
<template>
  <div>
    <h1>Books</h1>
    <template
          v-for="book in data" :key="book.author + book.title"
        >
        <p>
          <RouterLink :to="{name:'Book',params:{lang: book.lang, author:book.author, title:book.title}}">{{ book["author"] }}, {{ book["title"] }}</RouterLink>
          {{book["Word Count"]}} words
        </p>

    </template>
  </div>
</template>


<script lang="ts">
export default {
  name: "IndexPage",
}
</script>
<style scoped>
a {
  text-decoration: none;
}
</style>