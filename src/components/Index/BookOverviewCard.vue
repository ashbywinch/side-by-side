<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";

import { levelColorFor } from "./levels";

const props = defineProps({
  lang: { type:String, required:true},
  title: { type:String, required:true},
  author: { type:String, required:true},
  level: { type:String, required:true},
  size: { type:String, required:true},
  words: { type:Number, required:true},
  // Fraction read, or null when the reader has not read this book.
  progress: { type: Number as PropType<number | null>, default: null },
  finished: { type:Boolean, default:false },
  // Vertical, book-like card rather than the flat one.
  portrait: { type:Boolean, default:false },
})

const percent = computed(() =>
  props.progress === null
    ? null
    : Math.round(Math.min(Math.max(props.progress, 0), 1) * 100),
)

/**
 * A 7rem tile cannot hold "271975 words", so the portrait card abbreviates:
 * the magnitude is what matters when choosing, not the last three digits.
 */
const wordsLabel = computed(() => {
  if (!props.portrait || props.words < 1000) return `${props.words} words`
  const thousands = props.words / 1000
  return `${thousands < 10 ? thousands.toFixed(1) : Math.round(thousands)}k words`
})

</script>
<template>
  <RouterLink :to="{name:'Book',params:{lang: lang, author:author, title:title}}">
  <va-card class="item" :class="{ portrait }">
    <va-card-title>{{ title }}</va-card-title>
    <va-card-content>
      {{ author }}
      <div class="breath" />
      <!-- One quiet line of metadata: level keeps its colour as a dot, and the
           words and progress are subordinate to the title. -->
      <p class="meta">
        <span class="meta__item">
          <span class="dot" :style="{ background: levelColorFor(level) }" aria-hidden="true" />{{ level }}
        </span>
        <span class="meta__item">{{ wordsLabel }}</span>
        <span v-if="finished" class="meta__item meta__item--finished">Finished</span>
        <span v-else-if="percent !== null" class="meta__item">{{ percent }}% read</span>
      </p>
    </va-card-content>
    <span
      v-if="percent !== null"
      class="progress"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent"
      :aria-label="`${percent}% read`"
    >
      <span class="progress__fill" :style="{ width: `${percent}%` }" />
    </span>
  </va-card>
  </RouterLink>
</template>
<style scoped>
.va-card-title {
  font-size:1.2rem !important;
  font-weight: 300 !important;
  text-transform: none !important;
  padding-bottom: .3rem !important;
}
.va-card-content {
  font-size: 1rem !important;
}
.va-badge * {
  font-size: 1rem !important;
  text-transform: none !important;
}
div.row a:focus .va-card {
  border: 1px solid var(--va-primary);
}
/* The card's root is the link; it must take the cell's height so cards in a
   row line up even when a title wraps. */
a {
  display: flex;
  height: 100%;
  min-width: 0;
}
/* A card fills its grid cell. The badges and the progress edge sit on the
   bottom, so cards whose titles wrap to different heights still line up. */
:deep(.va-card) {
  min-height: 100%;
}
.item {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 6.5rem;
  padding-bottom: 0;
  overflow: hidden;
}
.item .va-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .1rem .35rem;
  margin: auto 0 0;
  padding-top: .5rem;
  color: var(--va-text-secondary);
  font-size: .72rem;
  line-height: 1rem;
}
.meta__item {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
}
.meta__item--finished {
  color: var(--va-success, #2a8a4a);
  font-weight: 500;
}
.dot {
  width: .45rem;
  height: .45rem;
  border-radius: 50%;
  display: inline-block;
}
.breath {
  height: .75rem;
}
.read--small {
  font-size: .7rem;
  margin-top: .15rem;
}
.read {
  margin-top: .25rem;
  color: var(--va-text-secondary);
  font-size: .8rem !important;
}
.finished {
  color: var(--va-success);
  font-weight: 600;
}
/* The progress bar is the card's bottom edge, not a widget inside it. */
.progress {
  display: block;
  height: 4px;
  margin-top: .5rem;
  background: var(--va-background-element, rgb(0 0 0 / 8%));
}
.progress__fill {
  display: block;
  height: 100%;
  background: var(--va-primary);
}
/* Portrait: a book-shaped tile. Whitespace does the spacing; the badges and
   the bar sit on the bottom edge so ragged titles do not misalign the row. */
.item.portrait {
  display: flex;
  flex-direction: column;
  min-height: 9rem;
  padding-bottom: 0;
}
.item.portrait .va-card-title {
  font-size: .95rem !important;
  line-height: 1.2rem !important;
}
.item.portrait .va-card__content {
  font-size: .8rem !important;
}
.item.portrait :deep(.va-badge) {
  max-width: 100%;
}
.item.portrait :deep(.va-badge *) {
  font-size: .62rem !important;
  line-height: 1rem !important;
}
.item.portrait .breath {
  height: 0;
  flex: 1 1 auto;
}
.item.portrait .va-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
}
.item.portrait .badges {
  margin-top: auto;
  flex-direction: column;
  align-items: flex-start;
  gap: .15rem;
}
</style>
