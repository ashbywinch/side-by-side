<script setup lang="ts">
import { watch, watchEffect } from 'vue';

import { useFetchIndexItems } from "./FetchIndex"
import { useFilter } from './FilterIndex';
import { Filter } from '@/components/Index/Filter';
import { usePagination } from '@/components/Pagination'
import { useIndexRouting } from './IndexPageRouting'

import BookOverviewCards from '@/components/Index/BookOverviewCards.vue';
import BookFilter from '@/components/Index/BookFilter.vue';
import BookshelfRail from '@/components/Index/BookshelfRail.vue';
import BookshelfSection from '@/components/Index/BookshelfSection.vue';
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from '@/components/PageSurround.vue';
import { useBookshelf } from '@/components/Bookshelf/useBookshelf';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  lang: { type:String, required:true},
  // How the bookshelf is drawn above the catalogue. Chosen by walkthrough.
  shelfLayout: { type:String, default:null },
  portrait: { type:Boolean, default:false },
})

const bookshelf = useBookshelf()

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

// The route component is keyed by path, so query-only navigation (filters,
// pagination, browser back/forward) must be applied here instead of remounting.
watch(() => route.query, (query) => {
  filter.set(new Filter(
    query.level as string,
    query.size as string,
    query.author as string,
  ));
  pagination.set(Number(query.page ?? 1));
}, { deep: true });

function updatePageValue(newPage: number)
{
  pagination.set(newPage)
  indexRouting.reload(router, route, currentFilter(), newPage)
}
function updateFilterValue(newFilter: Filter)
{
  filter.set(newFilter)
  pagination.set(1)
  indexRouting.reload(router, route, newFilter, 1)
}
function currentFilter(): Filter {
  return new Filter(
    filter.filter.level.value,
    filter.filter.size.value,
    filter.filter.author.value,
  )
}

</script>
<template>
  <PageSurround :error="fetchItems.error.value">
    <BookshelfSection
      v-if="shelfLayout === 'section'"
      :books="fetchItems.items.value"
      :entries="bookshelf.entries.value"
      :portrait="portrait"
      :lang="lang" />
    <BookshelfRail
      v-else-if="shelfLayout === 'rail'"
      :books="fetchItems.items.value"
      :entries="bookshelf.entries.value"
      :portrait="portrait" />
    <BookFilter class="nav" :books=fetchItems.items.value :filter="filter.filter" @update-filter-value="updateFilterValue"/>
    <BookOverviewCards
      :books="pagination.items.value"
      :entries="bookshelf.entries.value"
      :portrait="portrait" />
    <SimplePagination :page="pagination.page.value" :pages="pagination.numPages.value" :visible-pages="1" @update-page-value="updatePageValue"/>
  </PageSurround>
</template>
