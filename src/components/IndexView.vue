<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const props = defineProps({
  lang: { type:String, required:true},
})

const is_loading = ref(false)
const index = ref([])
const error = ref("")

async function fetchIndex() {
  try {
    is_loading.value = true
    const url = `/api/books/${props.lang}/index.jsonl`;
    await fetch(url)
            .then(response => response.text())
            .then(text => text.split("\n")
              .filter(line => line.length > 0)
              .forEach(line => index.value.push(JSON.parse(line)))) // incremental loading
  } catch(err) {
    error.value = err
  }
  finally {
    is_loading.value = false
  }
}

watchEffect(() => { fetchIndex() });


</script>
<template>
  <div>
    <h1>Books</h1>
    <template
          v-for="book in index" :key="book.author + book.title"
        >
        <p>
          <RouterLink :to="{name:'Book',params:{lang: book.lang, author:book.author, title:book.title}}">{{ book["author"] }}, {{ book["title"] }}</RouterLink>
          {{book["Word Count"]}} words
        </p>

    </template>
  </div>
</template>

<style scoped>
a {
  text-decoration: none;
}
</style>