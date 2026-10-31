<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useBookReader } from "@/components/Book/useBookReader";

import PageOfBook from "@/components/Book/PageOfBook.vue"
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from "@/components/PageSurround.vue";

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

const route = useRoute()
const router = useRouter()

const reader = useBookReader({
  lang: props.lang,
  author: props.author,
  title: props.title,
  autoPrefetch: true,
})

function requestedPage(): number {
  return Number(route.query.page ?? 1)
}

async function loadPage() {
  const requested = requestedPage()
  const effective = await reader.setPage(requested)
  if (effective !== requested) {
    await router.replace({
      name: route.name,
      params: route.params,
      query: { ...route.query, page: effective },
    })
  }
}

watch(() => route.query.page, loadPage, { immediate: true })
onUnmounted(() => reader.dispose())

function updatePageValue(newPage: number)
{
  if (newPage === reader.page.value) return
  router.push({
    name: route.name,
    params: route.params,
    query: { ...route.query, page: newPage }
  });
}
</script>
<template>
  <PageSurround :error="reader.error.value">
    <PageOfBook
      :cards="reader.pageItems.value"
      :title="title"
      :author="author"
      :page="reader.page.value"
      :num-pages="reader.numPages.value"
      :loading="reader.loading.value"
    />
    <SimplePagination
      :page="reader.page.value"
      :pages="reader.numPages.value"
      :visible-pages="1"
      @update-page-value="updatePageValue"
    />
  </PageSurround>
</template>
