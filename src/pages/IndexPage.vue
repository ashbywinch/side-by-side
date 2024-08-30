<script setup lang="ts">
import { watchEffect } from 'vue';

import { useFetchIndexItems, items, error } from "./FetchIndex"
import { useFilter, setFilter, filter, filtered_items } from '@/pages/FilterIndex';
import { usePagination, setPage, page, paginated_items } from '@/components/Pagination'
import { getPage, getFilter, reload } from './IndexPageRouting'

import BookOverviewCards from '@/components/BookOverviewCards.vue';
import BookFilter from '@/components/BookFilter.vue';
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from '@/components/PageSurround.vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  lang: { type:String, required:true},
})

const perPage = 24; 

watchEffect(() => { useFetchIndexItems(props.lang) });
useFilter(items)
usePagination(filtered_items, perPage)

const route = useRoute();
setFilter(getFilter(route));
console.log(filter)
setPage(getPage(route));

const router = useRouter();
function updatePageValue(newPage)
{
  setPage(newPage)
  reload(router, route, filter, newPage)
}
function updateFilterValue(filter)
{
  setFilter(filter)
  setPage(1)
  reload(router, route, filter, 1)
}

</script>
<template>
  <PageSurround :error="error">
    <BookFilter class="nav" :books=items :filter="filter" @update-filter-value="updateFilterValue"/>
    <BookOverviewCards :books="paginated_items"/>
    <SimplePagination :page="page" :items="filtered_items.length" :per-page="perPage" @update-page-value="updatePageValue"/>
  </PageSurround>
</template>

<style scoped>
header {
  margin-bottom: 2rem !important;
}
header * {
  font-size: 1.2rem !important;
}
.nav {
  margin-bottom: 1rem;
}
.container {
  margin-left: 1rem
}
</style>