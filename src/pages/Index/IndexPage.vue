<script setup lang="ts">
import { watchEffect } from 'vue';

import { useFetchIndexItems } from "./FetchIndex"
import { useFilter } from './FilterIndex';
import { usePagination } from '@/components/Pagination'
import { useIndexRouting } from './IndexPageRouting'

import BookOverviewCards from '@/components/Index/BookOverviewCards.vue';
import BookFilter from '@/components/Index/BookFilter.vue';
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from '@/components/PageSurround.vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  lang: { type:String, required:true},
})

const perPage = 24; 

const fetchItems = useFetchIndexItems(props.lang);
watchEffect(() => fetchItems.fetch());

const filter = useFilter(fetchItems.items)
const pagination = usePagination(filter.items, perPage)

const route = useRoute();
const indexRouting = useIndexRouting();

filter.set(indexRouting.getFilter(route));
pagination.set(indexRouting.getPage(route));

const router = useRouter();
function updatePageValue(newPage)
{
  pagination.set(newPage)
  indexRouting.reload(router, route, filter, newPage)
}
function updateFilterValue(newFilter)
{
  filter.set(newFilter)
  pagination.set(1)
  indexRouting.reload(router, route, newFilter, 1)
}

</script>
<template>
  <PageSurround :error="fetchItems.error.value">
    <BookFilter class="nav" :books=fetchItems.items.value :filter="filter.filter" @update-filter-value="updateFilterValue"/>
    <BookOverviewCards :books="pagination.items.value"/>
    <SimplePagination :page="pagination.page.value" :items="filter.items.value.length" :per-page="perPage" @update-page-value="updatePageValue"/>
  </PageSurround>
</template>
