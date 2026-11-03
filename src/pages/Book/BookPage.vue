<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMediaQuery } from "@vueuse/core";

import { pageForPosition, positionForPage } from "@/components/Bookshelf/position";
import { useBookshelf } from "@/components/Bookshelf/useBookshelf";
import { pageAfter, type PageTurn, type TurnSource } from "@/components/Book/pageTurn";
import { createPageSlide, PAGE_SLIDE_MS } from "@/components/Book/usePageSlide";
import { usePageMargins } from "@/components/Book/usePageMargins";
import { usePageTurnHint } from "@/components/Book/usePageTurnHint";
import { usePageTurning } from "@/components/Book/usePageTurning";
import { useBookReader } from "@/components/Book/useBookReader";
import { prefersReducedMotion } from "@/components/motion";
import type { Book } from "@/types/bookshelf";

import PageOfBook from "@/components/Book/PageOfBook.vue"
import BookNotice from "@/components/Book/BookNotice.vue"
import PageTurnHint from "@/components/Book/PageTurnHint.vue"
import PageTurnTargets from "@/components/Book/PageTurnTargets.vue"
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
const readerEl = ref<HTMLElement | null>(null)
const pageSurface = ref<HTMLElement | null>(null)
const pageRef = ref<{
  scrollToSegment: (segment: number) => void
  contentElement?: HTMLElement | null
  cardElement?: HTMLElement | null
} | null>(null)

const contentEl = computed<HTMLElement | null>(() => pageRef.value?.contentElement ?? null)
const { previous: previousMargin, next: nextMargin } = usePageMargins(contentEl, readerEl)
const { visible: hintVisible, consider: considerHint, learned: hintLearned, hide: hideHint, dispose: disposeHint } =
  usePageTurnHint()
const coarsePointer = useMediaQuery("(pointer: coarse)")
const debug = computed(() => route.query.debug === "1")
const DEBUG_BUILD = `build ${__BUILD_STAMP__}`

const reducedMotion = computed(
  () => typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false),
)
const debugTurn = ref<{ direction: PageTurn; offset: number } | null>(null)
const debugSample = ref({
  animation: "none",
  duration: "0s",
  transform: "none",
  cls: "",
  viewport: "",
  turnAnimation: "none",
})
const debugTrace = ref<number[]>([])
const debugTextMin = ref(1)
const debugCardClass = ref("")
let debugTimer: ReturnType<typeof setInterval> | null = null
let traceFrame: number | null = null

function translatedX(transform: string): number {
  const match = transform.match(/^matrix(3d)?\(([^)]+)\)$/);
  if (!match) return 0;
  const parts = match[2].split(",").map(Number);
  const value = parts[match[1] ? 12 : 4];
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/** Record the reader's X each frame for the next half second. */
function startTurnTrace(): void {
  if (!debug.value || typeof requestAnimationFrame !== "function") return;
  if (traceFrame !== null) cancelAnimationFrame(traceFrame);
  debugTrace.value = [];
  debugTextMin.value = 1;
  debugCardClass.value = "";
  const text = document.querySelector(".page .text") as HTMLElement | null;
  const card = document.querySelector(".page") as HTMLElement | null;
  if (card) debugCardClass.value = card.className;
  const until = performance.now() + 600;
  const tick = () => {
    const element = readerEl.value;
    if (element) {
      const sample = translatedX(getComputedStyle(element).transform);
      debugTrace.value = [...debugTrace.value, sample];
    }
    if (text) {
      const opacity = Number(getComputedStyle(text).opacity);
      if (Number.isFinite(opacity) && opacity < debugTextMin.value) debugTextMin.value = opacity;
    }
    if (performance.now() < until && debugTrace.value.length < 45) {
      traceFrame = requestAnimationFrame(tick);
    } else {
      traceFrame = null;
    }
  };
  traceFrame = requestAnimationFrame(tick);
}

function sampleDebug(): void {
  const element = readerEl.value
  if (!element) return
  const style = getComputedStyle(element)
  const turning = element.classList.contains("reader--turn-next") || element.classList.contains("reader--turn-previous")
  const animations = typeof element.getAnimations === "function" ? element.getAnimations() : []
  const running = animations.find((animation) => animation.playState === "running")
  debugSample.value = {
    animation: style.animationName,
    duration: style.animationDuration,
    transform: style.transform,
    cls: element.className,
    viewport: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`,
    turnAnimation: turning
      ? running
        ? `waapi / ${Math.round(Number(running.effect?.getTiming().duration ?? 0))}ms`
        : "class only"
      : debugSample.value.turnAnimation,
  }
}

watch(
  debug,
  (on) => {
    if (debugTimer !== null) {
      clearInterval(debugTimer)
      debugTimer = null
    }
    if (!on) return
    sampleDebug()
    debugTimer = setInterval(sampleDebug, 100)
  },
  { immediate: true },
)
const hintSetting = computed(() => String(route.query["turn-hint"] ?? ""))
const forceHint = computed(() => ["1", "click", "swipe"].includes(hintSetting.value))
const hintCoarse = computed(() =>
  hintSetting.value === "swipe" ? true : hintSetting.value === "click" ? false : coarsePointer.value,
)
/** Keep in step with the `reader--hint-next` animation in this file's styles. */
const HINT_NUDGE_MS = 1500
let hintNudgeTimer: ReturnType<typeof setTimeout> | null = null
interface PeekBox {
  left: number
  /** Document offset of the card's top: the turn scrolls to the top, so the
   *  incoming page will sit here, and the peek must sit here too. */
  top: number
  width: number
  viewport: number
}
const peekBox = ref<PeekBox | null>(null)
const dragging = ref(false)

/** The page card's box, captured before a hint or drag moves it. */
function cardBox(): PeekBox | null {
  const card = pageRef.value?.cardElement
  if (!card) return null
  const rect = card.getBoundingClientRect()
  if (rect.width <= 0) return null
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    viewport: document.documentElement.clientWidth,
  }
}

const hintPeek = computed(
  () =>
    hintVisible.value &&
    hintCoarse.value &&
    nextMargin.value !== null &&
    peekBox.value !== null &&
    !prefersReducedMotion(),
)
/** The next page's card, waiting one panel to the right; the nudge slides it in. */
const hintPeekStyle = computed<Record<string, string> | undefined>(() => {
  const box = peekBox.value
  if (!box) return undefined
  return {
    left: `${box.viewport + box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
  }
})

/** The adjacent page's card sliding in from the side under a finger drag. */
const dragPeek = ref<{ direction: PageTurn; offset: number } | null>(null)
const dragPeekStyle = computed<Record<string, string> | undefined>(() => {
  const peek = dragPeek.value
  const box = peekBox.value
  if (!peek || !box) return undefined
  const left =
    peek.direction === "next"
      ? box.viewport - peek.offset + box.left
      : box.left - box.viewport + peek.offset
  return { left: `${left}px`, top: `${box.top}px`, width: `${box.width}px` }
})
let snapBackTimer: ReturnType<typeof setTimeout> | null = null
let turnContentTimer: ReturnType<typeof setTimeout> | null = null
const ghostEl = ref<HTMLElement | null>(null)
const slide = createPageSlide({
  ghost: ghostEl,
  reader: readerEl,
  card: () => pageRef.value?.cardElement ?? null,
})
let pendingSlide: PageTurn | null = null
let pendingSlideOffset = 0
let lastDragOffset = 0

/** Hint motion: the page itself nudges left under the hand, then eases back. */
function clearHintNudge(): void {
  if (hintNudgeTimer !== null) {
    clearTimeout(hintNudgeTimer)
    hintNudgeTimer = null
  }
  readerEl.value?.classList.remove("reader--hint-next")
}

function runHintNudge(): void {
  const element = readerEl.value
  if (!element || prefersReducedMotion()) return
  clearHintNudge()
  void element.offsetWidth
  element.classList.add("reader--hint-next")
  hintNudgeTimer = setTimeout(() => {
    hintNudgeTimer = null
    element.classList.remove("reader--hint-next")
  }, HINT_NUDGE_MS + 200)
}

watch([hintVisible, hintCoarse], ([visible, coarse]) => {
  if (visible && coarse) {
    peekBox.value = cardBox()
    runHintNudge()
    return
  }
  clearHintNudge()
  if (!dragging.value) peekBox.value = null
})

function clearSnapBack(): void {
  if (snapBackTimer !== null) {
    clearTimeout(snapBackTimer)
    snapBackTimer = null
  }
}

function clearTurnContent(): void {
  if (turnContentTimer !== null) {
    clearTimeout(turnContentTimer)
    turnContentTimer = null
  }
  const card = pageRef.value?.cardElement
  card?.classList.remove("page--turn-in")
  card?.classList.remove("page--turn-pending")
}

/** A horizontal drag has locked: the page starts following the finger. */
function beginDrag(): void {
  dragging.value = true
  hideHint()
  clearHintNudge()
  clearSnapBack()
  dragPeek.value = null
  lastDragOffset = 0
  const element = readerEl.value
  if (element) {
    element.style.transition = "none"
    element.style.transform = ""
    element.style.willChange = "transform"
    void element.offsetWidth
  }
  peekBox.value = cardBox()
}

/** 1:1 tracking: the finger moves, the page moves with it. */
function dragPage(turn: PageTurn, distance: number, available: boolean): void {
  const limit = Math.max(80, Math.round(window.innerWidth * 0.45))
  const applied = available ? Math.min(distance, limit) : Math.min(8, distance * 0.15)
  const element = readerEl.value
  if (element) {
    element.style.transition = "none"
    element.style.transform = `translateX(${turn === "next" ? -applied : applied}px)`
  }
  dragPeek.value = available && applied > 0 ? { direction: turn, offset: applied } : null
  lastDragOffset = available ? applied : 0
}

function finishDrag(_turn: PageTurn | null, _distance: number, commit: boolean): void {
  // A committed drag is completed by onTurn/updatePageValue; loadPage resets
  // the drag at the content swap, so the snapshot keeps the release position.
  if (commit) return
  snapBack()
}

function snapBack(): void {
  clearSnapBack()
  dragPeek.value = null
  dragging.value = false
  peekBox.value = null
  lastDragOffset = 0
  const element = readerEl.value
  if (!element) return
  element.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)"
  element.style.transform = ""
  snapBackTimer = setTimeout(() => {
    snapBackTimer = null
    element.style.transition = ""
    element.style.willChange = ""
  }, 240)
}

function resetDrag(): void {
  clearSnapBack()
  dragPeek.value = null
  dragging.value = false
  peekBox.value = null
  lastDragOffset = 0
  clearTurnContent()
  const element = readerEl.value
  if (!element) return
  element.style.transition = "none"
  element.style.transform = ""
  void element.offsetWidth
  element.style.transition = ""
  element.style.willChange = ""
}

/**
 * Before the new page paints, put it where the row puts it: one panel to the
 * side, less the drag. `slide.play` then animates it to rest in step with the
 * outgoing snapshot.
 */
function setTurnStart(direction: PageTurn, offset: number): void {
  clearSnapBack()
  dragPeek.value = null
  dragging.value = false
  peekBox.value = null
  lastDragOffset = 0
  const element = readerEl.value
  if (!element) return
  const viewport = document.documentElement.clientWidth || window.innerWidth
  const start = direction === "next" ? viewport - offset : -(viewport - offset)
  element.style.transition = "none"
  element.style.transform = `translateX(${start}px)`

  // Hide the new page's contents while the browser lays it out. The peek was
  // a blank card, so the white card staying blank is continuous; the contents
  // fade in with the row once the paint is done.
  const card = pageRef.value?.cardElement
  if (card) {
    card.classList.remove("page--turn-in")
    card.classList.add("page--turn-pending")
  }
}

/** Start the row's content fade on a clean frame, after the new page paints. */
function startTurnContent(): void {
  const card = pageRef.value?.cardElement
  if (card) {
    card.classList.remove("page--turn-pending")
    card.classList.remove("page--turn-in")
    void card.offsetWidth
    card.classList.add("page--turn-in")
    if (turnContentTimer !== null) {
      clearTimeout(turnContentTimer)
      turnContentTimer = null
    }
    turnContentTimer = setTimeout(() => {
      turnContentTimer = null
      card.classList.remove("page--turn-in")
    }, 560)
  }
  startTurnTrace()
}

/** Resolve after the browser has had a chance to paint the new page. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") {
      resolve()
      return
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

// Page changes we made ourselves must not be read back as a page turn.
let programmaticPage: number | null = null
let loaded = false
let previousPage = 0
// Only the initial load and an explicit page turn move the viewport; history
// traversal is left to the router's saved position.
let scrollOnLoad = true
let urlSyncTimer: ReturnType<typeof setTimeout> | null = null

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

async function loadPage(targetPage?: number) {
  const transition = pendingSlide
  const offset = pendingSlideOffset
  pendingSlide = null
  pendingSlideOffset = 0

  const wanted = targetPage ?? (await resolvePage())
  const effective = await reader.setPage(wanted)
  if (transition && !reader.error.value && !prefersReducedMotion()) setTurnStart(transition, offset)
  else resetDrag()

  if (targetPage === undefined && Number(route.query.page) !== effective) {
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
  considerHintForOpen()

  await nextTick()


  if (scrollOnLoad) {
    scrollOnLoad = false
    // A fresh open is already at the top: the router resets the window on a
    // route change. Only a stored position or a turn has anywhere to go.
    if (start !== pageStart) pageRef.value?.scrollToSegment(start)
    else if (transition) window.scrollTo({ top: 0 })
  }

  if (transition && !reader.error.value && !prefersReducedMotion()) {
    // Let the new page lay out and paint first: the snapshot covers the
    // viewport while it happens, and the row then starts on a clean frame
    // instead of losing its middle frames to the layout work.
    await nextPaint()
    startTurnContent()
    slide.play(transition)
    scheduleUrlSync(effective)
  } else {
    resetDrag()
    slide.end()
    // No row to protect: point the URL at the page right away.
    syncUrl(effective)
  }
}

watch(
  () => route.query.page,
  (value) => {
    if (programmaticPage !== null && Number(value) === programmaticPage) {
      programmaticPage = null
      return
    }
    // Our own URL sync lands after the turn: never reload a page already shown.
    if (loaded && Number(value) === reader.page.value) return
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
  if (debugTimer !== null) {
    clearInterval(debugTimer)
    debugTimer = null
  }
  if (traceFrame !== null) {
    cancelAnimationFrame(traceFrame)
    traceFrame = null
  }
  if (urlSyncTimer !== null) {
    clearTimeout(urlSyncTimer)
    urlSyncTimer = null
  }
  clearHintNudge()
  resetDrag()
  slide.end()
  disposeHint()
  flush()
  reader.dispose()
})

function updatePageValue(newPage: number)
{
  if (newPage === reader.page.value) return
  const direction: PageTurn = newPage > reader.page.value ? "next" : "previous"
  const offset = dragging.value ? lastDragOffset : 0
  if (debug.value) {
    debugTurn.value = { direction, offset }
    debugSample.value = { ...debugSample.value, turnAnimation: "pending" }
    debugTrace.value = []
  }
  pendingSlide = direction
  pendingSlideOffset = offset
  clearHintNudge()
  slide.begin(offset)
  hideHint()
  scrollOnLoad = true
  // The turn is local: the reader owns the page, and the URL follows it once
  // the row has finished. Navigating here re-renders the route while the row
  // is animating, which drops frames on a phone and reads as a jump.
  void loadPage(newPage)
}

/** Point the URL at the page the reader is on, without disturbing the turn. */
function syncUrl(page: number): void {
  if (Number(route.query.page) === page) return
  programmaticPage = page
  void router.push({
    name: route.name,
    params: route.params,
    query: { ...route.query, page },
  })
}

/** Let the row finish first: the route must not re-render during the slide. */
function scheduleUrlSync(page: number): void {
  if (urlSyncTimer !== null) clearTimeout(urlSyncTimer)
  urlSyncTimer = setTimeout(() => {
    urlSyncTimer = null
    syncUrl(reader.page.value || page)
  }, PAGE_SLIDE_MS + 80)
}

/** The page the reader is looking at: the reader owns it, not the URL. */
function currentPage(): number {
  return reader.page.value || 1
}

function canTurn(which: PageTurn): boolean {
  if (reader.error.value) return false
  const total = reader.numPages.value
  if (total <= 1) return false
  return pageAfter(currentPage(), total, which) !== currentPage()
}

function turn(which: PageTurn, source: TurnSource = "pager"): void {
  if (!canTurn(which)) return
  updatePageValue(pageAfter(currentPage(), reader.numPages.value, which))
  if (source === "swipe" || source === "margin") hintLearned()
}

/**
 * The lesson is for every reader until the device has shown it a few times or
 * the reader turns a page by swipe or margin. The book's own history does not
 * matter: a resumed book can still teach the gesture. `?turn-hint=1` forces it
 * for a demo without spending one of the device's showings.
 */
function considerHintForOpen(): void {
  if (reader.loading.value || reader.pageItems.value.length === 0) return
  considerHint({ total: reader.numPages.value, force: forceHint.value })
}

usePageTurning({
  target: pageSurface,
  canTurn,
  onTurn: turn,
  onDragStart: beginDrag,
  onDrag: dragPage,
  onDragEnd: finishDrag,
})
</script>
<template>
  <PageSurround :error="reader.error.value">
    <div ref="pageSurface" class="page-surface">
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
    <div ref="readerEl" class="reader">
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
    </div>
    <SimplePagination
      :page="reader.page.value"
      :pages="reader.numPages.value"
      :visible-pages="1"
      @update-page-value="updatePageValue"
    />
    <PageTurnTargets
      :previous="canTurn('previous') ? previousMargin : null"
      :next="canTurn('next') ? nextMargin : null"
      :can-previous="canTurn('previous')"
      :can-next="canTurn('next')"
      @turn="(which: PageTurn) => turn(which, 'margin')"
    />
    <PageTurnHint
      :previous="canTurn('previous') ? previousMargin : null"
      :next="canTurn('next') ? nextMargin : null"
      :visible="hintVisible"
      :coarse="hintCoarse"
    />
    <div ref="ghostEl" class="page-ghost" aria-hidden="true" inert />
    <div
      v-if="dragPeek"
      class="page-peek"
      :class="dragPeek.direction === 'next' ? 'page-peek--next' : 'page-peek--previous'"
      :style="dragPeekStyle"
      aria-hidden="true"
    />
    <div
      v-else-if="hintPeek"
      class="page-peek page-peek--next page-peek--hint"
      :style="hintPeekStyle"
      aria-hidden="true"
    />
    <div v-if="browsing" class="notice-spacer" aria-hidden="true" />
    </div>
    <pre v-if="debug" class="debug-panel" aria-hidden="true">{{ DEBUG_BUILD }}
reduce-motion: {{ reducedMotion ? "reduce" : "no-preference" }}
pointer: {{ coarsePointer ? "coarse" : "fine" }}
viewport: {{ debugSample.viewport }}
last turn: {{ debugTurn ? `${debugTurn.direction} @ ${debugTurn.offset}px` : "none" }}
turn animation: {{ debugSample.turnAnimation }}
trace: {{ debugTrace.join(" ") }}
text fade min: {{ debugTextMin }}
card at turn: {{ debugCardClass }}
animation: {{ debugSample.animation }} / {{ debugSample.duration }}
transform: {{ debugSample.transform }}
class: {{ debugSample.cls }}</pre>
  </PageSurround>
</template>
<style scoped>
.notice-spacer {
  height: 5.5rem;
}

.page-surface {
  touch-action: pan-y;
}

/* ?debug=1 only: what the device reports and what the turn animation is doing. */
.debug-panel {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 9999;
  max-width: calc(100% - 1rem);
  margin: 0;
  padding: 0.5rem 0.6rem;
  border-radius: 0.4rem;
  background: rgb(0 0 0 / 72%);
  color: #fff;
  font: 11px/1.4 monospace;
  white-space: pre-wrap;
  pointer-events: none;
}

.reader {
  position: relative;
  z-index: 1;
  touch-action: pan-y;
}

/* The turn's transform is driven by the Web Animations API with literal
   keyframes (usePageSlide.ts). A var() inside @keyframes would push the
   animation onto the main thread; these classes are markers only. */
.reader--turn-next,
.reader--turn-previous {
  will-change: transform;
}
/* The new page's contents are hidden while it lays out, then fade in as the
   row arrives. The peek during a drag is a blank card, so this keeps the
   release continuous instead of popping the text into the strip. */
.page--turn-pending > * {
  opacity: 0;
}
.page--turn-in > * {
  animation: page-content-in 240ms cubic-bezier(0.4, 0, 0.2, 1) 60ms both;
}
@keyframes page-content-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .page--turn-in > * {
    animation: none;
  }
}

/* The adjacent page's card, waiting one panel to the side. During a drag it
   slides in with the row; during the hint it rides the same keyframes as the
   page, so the two move together instead of the page stretching a margin. */
.page-peek {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 0;
  border-radius: 0.25rem;
  background: var(--va-background-secondary, #fff);
  pointer-events: none;
}
.page-peek--next {
  box-shadow: -10px 0 24px rgb(0 0 0 / 14%);
}
.page-peek--previous {
  box-shadow: 10px 0 24px rgb(0 0 0 / 14%);
}
.page-peek--hint {
  animation: reader-hint-next 1500ms 100ms 1 both;
}

/* Hint motion: the live page nudges left under the hand, then eases back.
   Keep in step with HINT_NUDGE_MS and the hand in PageTurnHint.vue. */
.reader--hint-next {
  animation: reader-hint-next 1500ms 100ms 1 both;
  will-change: transform;
}
@keyframes reader-hint-next {
  0% {
    transform: translateX(0);
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  12% {
    transform: translateX(-8px);
    animation-timing-function: cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  56% {
    transform: translateX(-56px);
    animation-timing-function: linear;
  }
  70% {
    transform: translateX(-56px);
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  100% {
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .reader--hint-next {
    animation: none;
  }
}

/* The outgoing page is frozen here at its viewport position, then wiped aside.
   The duration matches PAGE_SLIDE_MS in usePageSlide.ts. */
.page-ghost {
  position: fixed;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  pointer-events: none;
}
.page-ghost--out {
  will-change: transform;
}
</style>
