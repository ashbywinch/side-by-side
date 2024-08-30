<script setup lang="ts">
import { usePagination, paginated_items, setPage, page } from "@/components/Pagination";
import Book from "@/components/Book.vue"
import { useRoute, useRouter } from "vue-router";
import { ref, watchEffect } from "vue";

import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from "@/components/PageSurround.vue";

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

const is_loading = ref(false)
const cards = ref([])
const error = ref("")

async function fetchCards() {
  try {
    is_loading.value = true
    const url = `/api/books/${props.lang}/${props.author}/${props.title}.jsonl`
    await fetch(url)
            .then(response => response.text())
            .then(text => text.split("\n")
              .filter(line => line.length > 0)
              .forEach(line => cards.value.push(JSON.parse(line)))) // incremental loading
  } catch(err) {
    error.value = err
  }
  finally {
    is_loading.value = false
  }
}

watchEffect(() => { fetchCards() });

const perPage = 24; 
const router = useRouter()
const route = useRoute()

usePagination(cards, perPage);
setPage(Number(route.query.page ?? 1));

function updatePageValue(newPage)
{
  setPage(newPage)
  router.push({
    name: route.name,
    params: route.params,
    query: {"page": newPage}
  });
}
</script>
<template>
  <PageSurround :error="error">
    <Book :cards="paginated_items" :title="title" :author="author" :is-title-page="page == 1"/>
    <SimplePagination :page="page" :items="cards.length" :per-page="perPage" @update-page-value="updatePageValue"/>
  </PageSurround>
</template>
