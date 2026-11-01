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
})

const percent = computed(() =>
  props.progress === null
    ? null
    : Math.round(Math.min(Math.max(props.progress, 0), 1) * 100),
)

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
  <va-card class="item">
    <va-card-title>{{ title }}</va-card-title>
    <va-card-content>
      {{ author }}
      <br/><br/><br/>
      <div class="row va-spacing-x-2 badges">
        <va-badge :text="level" style="--va-badge-text-wrapper-border-radius: 1.5rem" :color="levelColorFor(level)"/>
        <va-badge :text="words + ' words'" style="--va-badge-text-wrapper-border-radius: 1.5rem;" :color="sizeColor[size]"/>
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
  font-size: 1.2rem !important;
  font-weight: 300 !important;
  text-transform: none !important;
  padding-bottom: .3rem !important;
}
.va-card-content {
  font-size: 1rem !important;
}
.va-badge * {
  font-size: .8rem !important;
  text-transform: none !important;
}
/* Stacked, so the width follows the title and the author; pinned to the card's
   bottom edge, so every tile in a row carries its pills on one line. */
.badges {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1.5rem;
  flex-direction: column;
  align-items: flex-start;
  gap: .3rem;
  margin: 0;
}
div.row a:focus .va-card {
  border: 1px solid var(--va-primary);
}
/* Portrait is a consequence of wrapping, not of a width we impose: the card is
   content-sized with a ceiling, so a long title and a long name wrap into a
   taller, narrower tile. Words break at spaces only — never inside a word, and
   never with a hyphen. */
.item {
  /* min-content: the card is as wide as its longest line and the title wraps
     into it, so the width follows the text instead of being imposed on it.
     Words break at spaces only — no hyphenation. */
  width: min-content;
  /* A floor so a two-word title with a small word count does not become a
     sliver: at the row's height this still reads as a book rather than a strip. */
  min-width: var(--card-min, 7.5rem);
  max-width: 9rem;
  /* The row stretches the card to its tallest neighbour; the bar stays on the
     card's bottom edge. */
  position: relative;
  /* Room for the pills, which sit on the card's bottom edge. */
  padding-bottom: 5.25rem;
  hyphens: none;
  overflow-wrap: normal;
  word-break: normal;
}
/* The bar is the card's bottom edge. */
a {
  display: flex;
  align-items: stretch;
  min-width: 0;
}
.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: block;
  height: 4px;
  background: var(--va-background-element, rgb(0 0 0 / 8%));
}
.progress__fill {
  display: block;
  height: 100%;
  background: var(--va-primary);
}
</style>
