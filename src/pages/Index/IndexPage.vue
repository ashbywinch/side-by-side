<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { useFetchIndexItems } from "./FetchIndex"
import { useFilter } from './FilterIndex';
import { Filter } from '@/components/Index/Filter';
import { usePagination } from '@/components/Pagination'
import { useIndexRouting } from './IndexPageRouting'

import BookOverviewCards from '@/components/Index/BookOverviewCards.vue';
import BookFilter from '@/components/Index/BookFilter.vue';
import ResultsBar from '@/components/Index/ResultsBar.vue';
import FilterSheet from '@/components/Index/FilterSheet.vue';
import BookshelfSection from '@/components/Index/BookshelfSection.vue';
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from '@/components/PageSurround.vue';
import { useBookshelf } from '@/components/Bookshelf/useBookshelf';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  lang: { type:String, required:true},
  // How the bookshelf is drawn above the catalogue: a short row of book tiles
  // with "See all" in its header — chosen by walkthrough, over a rail.
  shelfLayout: { type:String, default:'section' },
})

const bookshelf = useBookshelf()

// Filters are collapsed by default: a results bar says how many books there are
// and what is filtered. A phone opens them as a sheet; a desktop expands them
// in place.
const filtersOpen = ref(false)
const narrow = ref(false)
let media: MediaQueryList | null = null

function onMediaChange() {
  if (!media) return
  narrow.value = media.matches
  if (!narrow.value) filtersOpen.value = false
}

onMounted(() => {
  if (typeof window.matchMedia !== "function") return
  media = window.matchMedia("(max-width: 599px)")
  onMediaChange()
  media.addEventListener("change", onMediaChange)
})

onUnmounted(() => {
  media?.removeEventListener("change", onMediaChange)
})

function clearFilterValue(key: "level" | "size" | "author") {
  const next = currentFilter()
  next[key] = ""
  updateFilterValue(next)
}

function clearAllFilters() {
  updateFilterValue(new Filter("", "", ""))
}

function applySheetFilter(value: { level: string; size: string; author: string }) {
  updateFilterValue(new Filter(value.level, value.size, value.author))
  filtersOpen.value = false
}

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
      :books="fetchItems.items.value"
      :entries="bookshelf.entries.value"
      :lang="lang" />
    <ResultsBar
      :count="filter.items.value.length"
      :level="filter.filter.level.value"
      :size="filter.filter.size.value"
      :author="filter.filter.author.value"
      :open="filtersOpen"
      @toggle="filtersOpen = !filtersOpen"
      @clear="clearFilterValue"
      @clear-all="clearAllFilters" />
    <BookFilter
      v-if="filtersOpen && !narrow"
      class="nav"
      :books="fetchItems.items.value"
      :filter="filter.filter"
      @update-filter-value="updateFilterValue" />
    <FilterSheet
      v-if="narrow"
      :open="filtersOpen"
      :books="fetchItems.items.value"
      :filter="filter.filter"
      @apply="applySheetFilter"
      @close="filtersOpen = false" />
    <p v-if="fetchItems.items.value.length > 0 && pagination.items.value.length === 0" class="empty">
      No books match these filters.
      <button type="button" class="empty__reset" @click="clearAllFilters">Clear all</button>
    </p>
    <BookOverviewCards
      v-else
      :books="pagination.items.value"
      :entries="bookshelf.entries.value" />
    <SimplePagination :page="pagination.page.value" :pages="pagination.numPages.value" :visible-pages="1" @update-page-value="updatePageValue"/>
  </PageSurround>
</template>
<style scoped>
.empty {
  padding: 2rem 0;
  color: var(--va-text-secondary);
}
.empty__reset {
  border: 0;
  background: none;
  padding: .25rem;
  color: var(--va-primary);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
