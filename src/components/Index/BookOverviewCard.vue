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
      <div class="breath" />
      <div class="row va-spacing-x-2 badges">
        <va-badge :text="level" style="--va-badge-text-wrapper-border-radius: 1.5rem" :color="levelColorFor(level)"/>
        <va-badge :text="words + ' words'" style="--va-badge-text-wrapper-border-radius: 1.5rem;" :color="sizeColor[size]"/>
        <span v-if="finished" class="finished" aria-label="Finished">✓</span>
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
.badges {
  align-items: center;
}
.breath {
  height: 4rem;
}
.finished {
  color: var(--va-success);
  font-weight: 600;
}
/* The progress bar is the card's bottom edge, not a widget inside it. */
.progress {
  display: block;
  height: 3px;
  background: var(--va-shadow);
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
  width: 11rem;
  min-height: 16rem;
  padding-bottom: 0;
}
.item.portrait .va-card-title {
  font-size: 1.3rem !important;
}
.item.portrait .breath {
  height: 0;
}
.item.portrait .va-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.item.portrait .badges {
  margin-top: auto;
  flex-direction: column;
  align-items: flex-start;
  gap: .25rem;
}
</style>
