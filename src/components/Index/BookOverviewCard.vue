<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";

import { levelColorFor } from "./levels";

const rainbow = {
  1: "#817",
  2: "#a35",
  3: "#c66",
  4: "#e94",
  5: "#ed0",
  6: "#9d5",
  7: "#4d8",
  8: "#2cb",
  9: "#0bc",
  10: "#09c",
  11: "#36b",
  12: "#639",
} as Record<number, string>
const sizeColor: Record<string, string> = {
  "small": rainbow[6],
  "medium": rainbow[4],
  "large": rainbow[2],
}

const props = defineProps({
  lang: { type:String, required:true},
  title: { type:String, required:true},
  author: { type:String, required:true},
  level: { type:String, required:true},
  size: { type:String, required:true},
  words: { type:Number, required:true},
  // Fraction read, or null when the reader has not read this book.
  progress: { type: Number as PropType<number | null>, default: null },
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
      <div class="row va-spacing-x-2 badges">
        <va-badge :text="level" style="--va-badge-text-wrapper-border-radius: 1.5rem" :color="levelColorFor(level)"/>
        <va-badge :text="wordsLabel" style="--va-badge-text-wrapper-border-radius: 1.5rem;" :color="sizeColor[size]"/>
      </div>
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
/* The card's root is the link; it takes the cell's height so a row lines up. */
a {
  display: flex;
  min-width: 0;
}
.item {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 0;
  padding-bottom: 0;
  overflow: hidden;
}
.item :deep(.va-card__content) {
  display: flex;
  flex-direction: column;
  flex: 1;
}
/* Pinned to the card's bottom edge, so every tile in a row carries its pills at
   the same height. */
.badges {
  align-items: center;
  flex-wrap: wrap;
  gap: .3rem;
  margin-top: auto;
}
.breath {
  height: 1rem;
}
.item.portrait .breath {
  height: 1rem;
}
.item.portrait .va-card__content {
  font-size: .8rem;
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
  height: 11.5rem;
  min-height: 11.5rem;
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
  /* A fixed block, bottom-aligned: with varible title lengths the pills would
     otherwise start at different heights. */
  min-height: 2.7rem;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  gap: .15rem;
}
</style>
