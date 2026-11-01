<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { pageForPosition, positionForPage } from "@/components/Bookshelf/position";
import { useBookshelf } from "@/components/Bookshelf/useBookshelf";
import { useBookReader } from "@/components/Book/useBookReader";
import type { Book } from "@/types/bookshelf";

import PageOfBook from "@/components/Book/PageOfBook.vue"
import BookNotice from "@/components/Book/BookNotice.vue"
import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from "@/components/PageSurround.vue";

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

const route = useRoute()
const router = useRouter()
const bookshelf = useBookshelf()

const reader = useBookReader({
  lang: props.lang,
  author: props.author,
  title: props.title,
  autoPrefetch: true,
})

const book = computed<Book>(() => ({
  lang: props.lang,
  author: props.author,
  title: props.title,
  segments: reader.meta.value?.segments ?? 0,
}))

const entry = computed(() => bookshelf.entryFor(book.value))
// The page the reader has bookmarked: where they were reading.
const bookmarkPage = computed(() =>
  entry.value ? pageForPosition(entry.value.position, reader.perPage) : null,
)
// Looking around: the current page is not the bookmarked one. Nothing is
// written while browsing, so checking an earlier page cannot lose the bookmark.
const browsing = computed(
  () => bookmarkPage.value !== null && bookmarkPage.value !== reader.page.value,
)

const resumed = ref(false)
const pendingScroll = ref<number | null>(null)
const position = ref(0)
const pageRef = ref<{ scrollToSegment: (segment: number) => void } | null>(null)

// Page changes we made ourselves must not be read back as a page turn.
let programmaticPage: number | null = null
let loaded = false
let previousPage = 0
// Only the initial load and an explicit page turn move the viewport; history
// traversal is left to the router's saved position.
let scrollOnLoad = true

function requestedPage(): number {
  return Number(route.query.page ?? 1)
}

async function resolvePage(): Promise<number> {
  if (route.query.page !== undefined) return requestedPage()

  const stored = bookshelf.entryFor(book.value)
  if (!stored || stored.removedAt) return 1

  await reader.prepare()
  resumed.value = true
  pendingScroll.value = stored.position
  return pageForPosition(stored.position, reader.perPage)
}

async function loadPage() {
  const wanted = await resolvePage()
  const effective = await reader.setPage(wanted)

  if (Number(route.query.page) !== effective) {
    programmaticPage = effective
    await router.replace({
      name: route.name,
      params: route.params,
      query: { ...route.query, page: effective },
    })
  }

  const pageStart = positionForPage(effective, reader.perPage)
  const stored = bookshelf.entryFor(book.value)

  let start = pageStart
  if (pendingScroll.value !== null) {
    start = pendingScroll.value
    pendingScroll.value = null
  } else if (
    !loaded &&
    stored !== undefined &&
    !stored.removedAt &&
    pageForPosition(stored.position, reader.perPage) === effective
  ) {
    // A reload or a deep link: the page is right, the place on it may not be.
    start = stored.position
  }

  position.value = start

  if (loaded) {
    // Reading forward moves the bookmark. Everything else is browsing.
    const storedPage = stored ? pageForPosition(stored.position, reader.perPage) : null
    const forwardTurn = previousPage > 0 && effective === previousPage + 1
    // Only an adjacent turn forward is reading. Jumping to page 90 from page 1
    // (a stray pager click) must not put the book on the shelf at 99%.
    if (forwardTurn && storedPage !== effective) {
      bookshelf.touch(book.value, pageStart)
    }
    resumed.value = false
  } else {
    loaded = true
  }

  previousPage = effective

  await nextTick()

  if (scrollOnLoad) {
    scrollOnLoad = false
    if (start !== pageStart) pageRef.value?.scrollToSegment(start)
    else window.scrollTo({ top: 0 })
  }
}

watch(
  () => route.query.page,
  (value) => {
    if (programmaticPage !== null && Number(value) === programmaticPage) {
      programmaticPage = null
      return
    }
    void loadPage()
  },
  { immediate: true },
)

function onReveal(segment: number) {
  if (book.value.segments <= 0) return
  resumed.value = false
  bookshelf.reveal(book.value, segment, position.value)
}

function onPositionChange(segment: number) {
  position.value = segment
  resumed.value = false
  if (book.value.segments <= 0) return
  if (browsing.value) return
  bookshelf.setPosition(book.value, segment)
}

async function returnToBookmark() {
  const stored = entry.value
  if (!stored) return
  pendingScroll.value = stored.position
  scrollOnLoad = true
  await router.push({
    name: route.name,
    params: route.params,
    query: { ...route.query, page: pageForPosition(stored.position, reader.perPage) },
  })
}

function keepReadingHere() {
  if (book.value.segments <= 0) return
  bookshelf.touch(book.value, position.value)
}

async function startOver() {
  resumed.value = false
  pendingScroll.value = null
  position.value = 0
  scrollOnLoad = true
  bookshelf.restart(book.value)
  await router.push({
    name: route.name,
    params: route.params,
    query: { ...route.query, page: 1 },
  })
}

function flush() {
  bookshelf.flush()
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") flush()
}

onMounted(() => {
  window.addEventListener("pagehide", flush)
  document.addEventListener("visibilitychange", onVisibilityChange)
})

onUnmounted(() => {
  window.removeEventListener("pagehide", flush)
  document.removeEventListener("visibilitychange", onVisibilityChange)
  flush()
  reader.dispose()
})

function updatePageValue(newPage: number)
{
  if (newPage === reader.page.value) return
  scrollOnLoad = true
  router.push({
    name: route.name,
    params: route.params,
    query: { ...route.query, page: newPage }
  });
}
</script>
<template>
  <PageSurround :error="reader.error.value">
    <BookNotice v-if="browsing" variant="floating">
      <template #text>Bookmark on page <strong>{{ bookmarkPage }}</strong></template>
      <va-button size="small" @click="returnToBookmark">Return</va-button>
      <va-button
        size="small"
        preset="plain"
        style="color: var(--va-text-secondary)"
        @click="keepReadingHere">Stay here</va-button>
    </BookNotice>
    <BookNotice v-else-if="resumed" variant="inline">
      <template #text>Picked up where you left off</template>
      <va-button size="small" preset="plain" @click="startOver">Start from the beginning</va-button>
    </BookNotice>
    <PageOfBook
      ref="pageRef"
      :cards="reader.pageItems.value"
      :title="title"
      :author="author"
      :page="reader.page.value"
      :num-pages="reader.numPages.value"
      :loading="reader.loading.value"
      :revealed-through="entry?.revealedThrough ?? -1"
      :first-segment="positionForPage(reader.page.value, reader.perPage)"
      :show-translation-hint="(entry?.revealedThrough ?? -1) < 0"
      @reveal="onReveal"
      @position-change="onPositionChange"
    />
    <SimplePagination
      :page="reader.page.value"
      :pages="reader.numPages.value"
      :visible-pages="1"
      @update-page-value="updatePageValue"
    />
    <div v-if="browsing" class="notice-spacer" aria-hidden="true" />
  </PageSurround>
</template>
<style scoped>
.notice-spacer {
  height: 5.5rem;
}
</style>
