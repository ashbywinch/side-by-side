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
  // Vertical, book-like card rather than the flat one.
  portrait: { type:Boolean, default:false },
})

const percent = computed(() =>
  props.progress === null
    ? null
    : Math.round(Math.min(Math.max(props.progress, 0), 1) * 100),
)

// Same abbreviation the portrait tile has always used: 7rem cannot hold
// "271975 words" without spilling.
const wordsLabel = computed(() => {
  if (!props.portrait) return `${props.words} words`
  if (props.words < 1000) return `${props.words} words`
  const thousands = props.words / 1000
  return `${thousands < 10 ? thousands.toFixed(1) : Math.round(thousands)}k words`
})

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
  "large": rainbow[2]
}
</script>
<template>
  <RouterLink :to="{name:'Book',params:{lang: lang, author:author, title:title}}">
  <va-card class="item" :class="{ portrait }">
    <va-card-title>{{ title }}</va-card-title>
    <va-card-content>
      {{ author }}
      <br/><br/><br/>
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
/* The bar is the card's bottom edge, not a widget inside it. */
.item {
  padding-bottom: 0;
  overflow: hidden;
}
.progress {
  display: block;
  height: 4px;
  background: var(--va-background-element, rgb(0 0 0 / 8%));
}
.progress__fill {
  display: block;
  height: 100%;
  background: var(--va-primary);
}
/* Portrait: a book-shaped tile of one height, so every tile in a row puts its
   pills and its bar on the same lines. The height fits the tallest case in the
   corpus — a three-line title with a two-line author — and the pills are pinned
   above the bar rather than left to follow the text. */
.item.portrait {
  position: relative;
  width: 7rem;
  height: 12rem;
  overflow: hidden;
}
.item.portrait .va-card__content {
  padding-bottom: 4.5rem;
}
.item.portrait .badges {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1.5rem;
  flex-direction: column;
  align-items: flex-start;
  gap: .4rem;
  margin: 0;
}
.item.portrait .progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
}
.item.portrait .va-card-title {
  font-size: .95rem !important;
  line-height: 1.2rem !important;
}
.item.portrait .va-card__content {
  font-size: .8rem !important;
}
.item.portrait :deep(.va-badge *) {
  font-size: .62rem !important;
  line-height: 1rem !important;
}
</style>
