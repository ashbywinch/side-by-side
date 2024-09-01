<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { watchEffect } from "vue";

import { usePagination } from "@/components/Pagination";
import { useFetchJsonl } from "@/components/FetchJsonl";

import PageOfBook from "@/components/Book/PageOfBook.vue"
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from "@/components/PageSurround.vue";

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

const fetchJsonL = useFetchJsonl(`/api/books/${props.lang}/${props.author}/${props.title}.jsonl`);
watchEffect(() => { fetchJsonL.fetch() })

const perPage = 24; 
const router = useRouter()
const route = useRoute()

const pagination = usePagination(fetchJsonL.items, perPage);
pagination.set(Number(route.query.page ?? 1));

function updatePageValue(newPage)
{
  pagination.set(newPage)
  router.push({
    name: route.name,
    params: route.params,
    query: {"page": newPage}
  });
}
</script>
<template>
  <PageSurround :error="fetchJsonL.error.value">
    <PageOfBook :cards="pagination.items.value" :title="title" :author="author" :page="pagination.page.value" :num-pages = "pagination.numPages.value"/>
    <SimplePagination :page="pagination.page.value" :items="fetchJsonL.items.value.length" :per-page="perPage" visible-pages=1 @update-page-value="updatePageValue"/>
  </PageSurround>
</template>
