<script setup lang="ts">
import { computed } from "vue";

export interface FilterChip {
  key: "level" | "size" | "author";
  label: string;
}

const props = defineProps({
  count: { type: Number, required: true },
  level: { type: String, default: "" },
  size: { type: String, default: "" },
  author: { type: String, default: "" },
  open: { type: Boolean, default: false },
})

defineEmits(["toggle", "clear", "clear-all"])

const chips = computed<FilterChip[]>(() => {
  const active: FilterChip[] = []
  if (props.level) active.push({ key: "level", label: `Level: ${props.level}` })
  if (props.size) active.push({ key: "size", label: `Size: ${props.size}` })
  if (props.author) active.push({ key: "author", label: `Author: ${props.author}` })
  return active
})

const countLabel = computed(() =>
  props.count === 1 ? "1 book" : `${props.count.toLocaleString("en-GB")} books`,
)
</script>

<template>
  <div class="results-bar">
    <span class="count">{{ countLabel }}</span>

    <ul v-if="chips.length" class="chips">
      <li v-for="chip in chips" :key="chip.key">
        <button type="button" class="chip" @click="$emit('clear', chip.key)">
          <span class="chip__label">{{ chip.label }}</span>
          <span class="chip__x" aria-hidden="true">×</span>
          <span class="visually-hidden">Clear {{ chip.label }}</span>
        </button>
      </li>
      <li>
        <button type="button" class="clear-all" @click="$emit('clear-all')">Clear all</button>
      </li>
    </ul>

    <button
      type="button"
      class="filters"
      :aria-expanded="open"
      @click="$emit('toggle')">
      <va-icon name="filter_list" size="18px" />
      Filters<span v-if="chips.length" class="filters__count">{{ chips.length }}</span>
    </button>
  </div>
</template>

<style scoped>
.results-bar {
  padding-inline: .25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .4rem .75rem;
  margin: .25rem 0 .75rem;
}
.count {
  color: var(--va-text-secondary);
  font-size: .9rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .1rem .5rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 30%));
  border-radius: 1rem;
  background: transparent;
  color: var(--va-text-primary);
  font: inherit;
  font-size: .8rem;
  cursor: pointer;
}
.chip:hover {
  border-color: var(--va-primary);
}
.chip__label {
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chip__x {
  color: var(--va-text-secondary);
}
.clear-all {
  border: 0;
  background: none;
  padding: 0 .25rem;
  color: var(--va-text-secondary);
  font: inherit;
  font-size: .8rem;
  text-decoration: underline;
  cursor: pointer;
}
.filters {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  min-height: 2.25rem;
  margin-left: auto;
  padding: .25rem .8rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 35%));
  border-radius: 1rem;
  background: transparent;
  color: var(--va-text-primary);
  font: inherit;
  font-size: .85rem;
  font-weight: 500;
  cursor: pointer;
}
.filters:hover,
.filters[aria-expanded="true"] {
  border-color: var(--va-primary);
  color: var(--va-primary);
}
.filters__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  margin-left: .35rem;
  padding: 0 .25rem;
  border-radius: 1rem;
  background: var(--va-primary);
  color: var(--va-text-inverted, #fff);
  font-size: .7rem;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
