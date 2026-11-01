<script setup lang="ts">
import PageHeader from '@/components/Book/PageHeader.vue';
import TextSnippet from '@/components/Book/TextSnippet.vue';
import { topSegment } from '@/components/Bookshelf/position';
import type { BookSegment } from '@/components/Book/useBookReader';
import { onMounted, onUnmounted, ref, watch, type PropType } from 'vue';

const props = defineProps({
  title: { type:String, required: true},
  author: { type:String, required: true},
  cards: { type: Array as PropType<BookSegment[]>, required:true},
  page: {type:Number, required:true},
  numPages: {type:Number, required:true},
  loading: {type:Boolean, default:false},
  // The book-wide high-water mark: every card at or before it is uncovered.
  revealedThrough: {type:Number, default:-1},
  // Global index of the first card on this page.
  firstSegment: {type:Number, default:0},
})

const emit = defineEmits(["reveal", "position-change"])

// What is on screen right now. The stored mark says what has been read; this
// says what is showing, so hiding with Esc does not un-read anything.
const visible = ref(0)
const elements: Array<HTMLElement | null> = []
let ticking = false

function restored(): number {
  const uncoveredOnThisPage = props.revealedThrough - props.firstSegment + 1
  if (uncoveredOnThisPage <= 0) return 0
  return Math.min(uncoveredOnThisPage, props.cards.length)
}

watch(
  () => [props.page, props.revealedThrough, props.firstSegment, props.cards.length],
  () => { visible.value = restored() },
  { immediate: true },
)

function setCardElement(index: number, element: unknown) {
  elements[index] = (element as HTMLElement | null) ?? null
}

function revealAt(index: number) {
  if (index + 1 <= visible.value) return
  visible.value = index + 1
  emit("reveal", props.firstSegment + index)
}

function showMore() {
  if (visible.value < props.cards.length) revealAt(visible.value)
  return visible.value > 0
}
function showLess() {
  if (visible.value > 0) visible.value = visible.value - 1
  return visible.value > 0
}
function showNone() {
  visible.value = 0
}

function emitPosition() {
  const tops = props.cards.map((_, index) => {
    const element = elements[index]
    return element ? element.getBoundingClientRect().top : Number.POSITIVE_INFINITY
  })
  emit("position-change", props.firstSegment + topSegment(tops))
}

function onScroll() {
  if (ticking) return
  ticking = true
  const run = () => {
    ticking = false
    emitPosition()
  }
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run)
  else setTimeout(run, 0)
}

function onEvent(event: { key: string; ctrlKey: boolean; preventDefault: () => void }) {
  if (event.ctrlKey && event.key === "ArrowDown") {
    if (showMore()) event.preventDefault()
  } else if (event.ctrlKey && event.key === "ArrowUp") {
    if (showLess()) event.preventDefault()
  } else if (event.key === "Escape") {
    showNone();
    event.preventDefault();
  }
}

function scrollToSegment(segment: number) {
  const index = segment - props.firstSegment
  if (index < 0 || index >= props.cards.length) return
  const element = elements[index]
  if (element && typeof element.scrollIntoView === "function") {
    element.scrollIntoView({ block: "start" })
  }
}

defineExpose({ scrollToSegment })

onMounted(() => {
  window.addEventListener("keydown", onEvent, true);
  window.addEventListener("scroll", onScroll, { passive: true });
})

onUnmounted(() => {
  window.removeEventListener("keydown", onEvent, true);
  window.removeEventListener("scroll", onScroll);
})
</script>
<template>
  <va-card class="page">
    <PageHeader :title="title" :author="author" :is-title-page="page == 1"/>
    <div class="text" :aria-busy="loading ? 'true' : 'false'">
      <template
        v-for="(card, index) in cards"
        :key="`${card.start ?? 'segment'}-${index}`">
          <div :ref="(element) => setCardElement(index, element)" class="segment">
            <TextSnippet
              :text="card.text"
              :translation="card.translation"
              :show-translation="index < visible"
              @translation-clicked="revealAt(index)"/>
          </div>
      </template>
    </div>
    <div v-if="numPages > 1" class="row justify-center">
      <div>{{page}} of {{numPages}}</div>
    </div>
  </va-card>
</template>

<style scoped>
.text {
  margin: 3rem 0;
  white-space: pre-wrap;
}
.text * {
  line-height: 1.5em;
}
.screen-xs .text {
  margin: 1em 0;
}
.va-card__content {
  padding: 0.3rem;
}
.masked {
  color: transparent;
  background-color: var(--va-shadow);
}
.front,
.back {
  height: fit-content;
  box-shadow: none;
  line-height: 1.3rem;
}
.back:hover {
  cursor: pointer;
}
.page {
  width: 50rem;
  padding: 2rem;
  margin: 2rem auto;
}
.screen-xs .page {
    width: 100%;
    margin: 0;
    padding: 1rem;
    box-shadow:none;
}
</style>
