<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { all_sizes } from "@/components/sizes";
import { FilterRefs } from "@/components/Index/Filter";
import { levelOptions, normaliseLevelFilter } from "@/components/Index/levels";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";

const props = defineProps({
  filter: { type: FilterRefs, default: null },
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
})

const emit = defineEmits(["update-filter-value"])

const shadowLevel = ref(normaliseLevelFilter(props.filter.level.value))
const shadowSize = ref(props.filter.size.value ?? "")
const shadowAuthor = ref(props.filter.author.value)

// Keep the visible selection in sync with route changes (back/forward, links).
watch(
  () => props.filter.level.value,
  (level) => {
    shadowLevel.value = normaliseLevelFilter(level)
  },
)
watch(
  () => props.filter.author.value,
  (author) => {
    shadowAuthor.value = author
  },
)

const levels = computed(() => levelOptions(props.books))
const sizes = computed(() => [...all_sizes].map((size) => size[0]))
// Sorted by surname: a catalogue sorted by first name puts "Лев Толстой" under Л.
const authors = computed(() =>
  Array.from(new Set(props.books.map((book) => book.author))).sort((a, b) => {
    const surname = (name: string) => name.trim().split(/\s+/).pop() ?? name
    return surname(a).localeCompare(surname(b), "ru")
  }),
)

const open = ref(false)
const active = ref(-1)

const matches = computed(() => {
  const query = shadowAuthor.value.trim().toLowerCase()
  if (!query) return authors.value.slice(0, 8)
  return authors.value
    .filter((author) => author.toLowerCase().includes(query))
    .slice(0, 8)
})

function emitFilter() {
  emit("update-filter-value", {
    level: normaliseLevelFilter(shadowLevel.value),
    size: shadowSize.value,
    author: shadowAuthor.value,
  })
}

function onAuthorInput() {
  open.value = true
  active.value = -1
  // Typing is a search, not a filter: a half-typed surname is not an author, so
  // applying it would empty the catalogue while the reader is still typing.
}

function choose(author: string) {
  shadowAuthor.value = author
  open.value = false
  active.value = -1
  emitFilter()
}

function clearAuthor() {
  shadowAuthor.value = ""
  open.value = false
  emitFilter()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    open.value = true
    active.value = Math.min(active.value + 1, matches.value.length - 1)
    event.preventDefault()
  } else if (event.key === "ArrowUp") {
    active.value = Math.max(active.value - 1, 0)
    event.preventDefault()
  } else if (event.key === "Enter") {
    if (open.value && active.value >= 0 && matches.value[active.value]) {
      choose(matches.value[active.value])
      event.preventDefault()
    }
  } else if (event.key === "Escape") {
    open.value = false
    event.preventDefault()
  }
}
</script>
<template>
  <nav class="row filters">
    <label class="field">
      <span class="field__label">Level</span>
      <select v-model="shadowLevel" class="field__control" @change="emitFilter">
        <option value="">Any level</option>
        <option v-for="level in levels" :key="level.value" :value="level.value">
          {{ level.text }}
        </option>
      </select>
    </label>

    <label class="field">
      <span class="field__label">Size</span>
      <select v-model="shadowSize" class="field__control" @change="emitFilter">
        <option v-for="size in ['', ...sizes]" :key="size" :value="size">
          {{ size || "Any size" }}
        </option>
      </select>
    </label>

    <div class="field field--author">
      <label class="field__label" for="author-filter">Author</label>
      <div class="combo">
        <input
          id="author-filter"
          v-model="shadowAuthor"
          class="field__control"
          type="text"
          role="combobox"
          autocomplete="off"
          placeholder="Any author"
          :aria-expanded="open && matches.length > 0"
          aria-controls="author-options"
          :aria-activedescendant="active >= 0 ? `author-option-${active}` : undefined"
          @input="onAuthorInput"
          @focus="open = true"
          @keydown="onKeydown"
          @blur="open = false" />
        <button
          v-if="shadowAuthor"
          type="button"
          class="combo__clear"
          aria-label="Clear author"
          @click="clearAuthor">×</button>
        <ul
          v-if="open && matches.length"
          id="author-options"
          class="combo__list"
          role="listbox">
          <li
            v-for="(author, index) in matches"
            :id="`author-option-${index}`"
            :key="author"
            class="combo__option"
            :class="{ 'combo__option--active': index === active }"
            role="option"
            :aria-selected="index === active"
            @mousedown.prevent="choose(author)">
            {{ author }}
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.filters {
  gap: 1rem;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  flex: 1 1 12rem;
  min-width: 0;
}
.field__label {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .6px;
  text-transform: uppercase;
  color: var(--va-text-secondary);
}
.field__control {
  width: 100%;
  min-height: 2.5rem;
  padding: .35rem .5rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 35%));
  border-radius: .25rem;
  background: var(--va-background-primary, #fff);
  color: var(--va-text-primary);
  font: inherit;
  font-size: .95rem;
}
.field__control:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 1px;
}
.field--author {
  position: relative;
}
.combo {
  position: relative;
}
.combo__clear {
  position: absolute;
  top: 50%;
  right: .4rem;
  transform: translateY(-50%);
  border: 0;
  background: none;
  color: var(--va-text-secondary);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}
.combo__list {
  position: absolute;
  z-index: 60;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  max-height: 16rem;
  overflow-y: auto;
  margin: 0;
  padding: .25rem 0;
  list-style: none;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 35%));
  border-radius: .25rem;
  background: var(--va-background-primary, #fff);
  box-shadow: var(--va-box-shadow, 0 4px 8px rgb(0 0 0 / 15%));
}
.combo__option {
  padding: .4rem .6rem;
  cursor: pointer;
  font-size: .95rem;
}
.combo__option:hover,
.combo__option--active {
  background: var(--va-background-element, rgb(0 0 0 / 6%));
}
</style>
