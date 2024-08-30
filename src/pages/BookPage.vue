<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { watchEffect } from "vue";

import { usePagination, paginated_items, setPage, page } from "@/components/Pagination";
import { items, useFetchJsonl, error } from "@/components/FetchJsonl";

import Book from "@/components/PageOfBook.vue"
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from "@/components/PageSurround.vue";

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

watchEffect(() => { useFetchJsonl(`/api/books/${props.lang}/${props.author}/${props.title}.jsonl`) })

const perPage = 24; 
const router = useRouter()
const route = useRoute()

usePagination(items, perPage);
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
    <SimplePagination :page="page" :items="items.length" :per-page="perPage" @update-page-value="updatePageValue"/>
  </PageSurround>
</template>
