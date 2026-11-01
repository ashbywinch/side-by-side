<script setup lang="ts">
import { computed, ref, watch } from "vue";

export interface SelectOption {
  label: string;
  value: string;
}

/**
 * One listbox for every filter: a trigger (or a text field, when searchable)
 * and a list we draw and position ourselves. The design system's select never
 * opens inside the sheet, and the platform select cannot be styled.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    options: SelectOption[];
    placeholder: string;
    searchable?: boolean;
  }>(),
  { searchable: false },
)

const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const open = ref(false)
const active = ref(-1)
const query = ref("")

const selected = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? null,
)

const shown = computed(() => {
  if (!props.searchable) return props.options
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.options
  return props.options.filter((option) => option.label.toLowerCase().includes(needle))
})

watch(
  () => props.modelValue,
  () => {
    query.value = ""
  },
)

function openList() {
  open.value = true
  active.value = -1
}

function choose(option: SelectOption) {
  emit("update:modelValue", option.value)
  open.value = false
  active.value = -1
  query.value = ""
}

function clear() {
  emit("update:modelValue", "")
  open.value = false
  query.value = ""
}

function onInput() {
  open.value = true
  active.value = -1
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    open.value = true
    active.value = Math.min(active.value + 1, shown.value.length - 1)
    event.preventDefault()
  } else if (event.key === "ArrowUp") {
    active.value = Math.max(active.value - 1, 0)
    event.preventDefault()
  } else if (event.key === "Enter") {
    if (open.value && shown.value[active.value]) choose(shown.value[active.value])
    event.preventDefault()
  } else if (event.key === "Escape") {
    open.value = false
    event.preventDefault()
  }
}
</script>

<template>
  <div class="field">
    <label class="field__label" :for="`filter-${label}`">{{ label }}</label>
    <div class="control">
      <input
        v-if="searchable"
        :id="`filter-${label}`"
        v-model="query"
        class="control__box"
        type="text"
        role="combobox"
        autocomplete="off"
        :placeholder="selected ? selected.label : placeholder"
        :aria-expanded="open && shown.length > 0"
        :aria-controls="`options-${label}`"
        :aria-activedescendant="active >= 0 ? `option-${label}-${active}` : undefined"
        @focus="openList"
        @input="onInput"
        @keydown="onKeydown"
        @blur="open = false" />
      <button
        v-else
        :id="`filter-${label}`"
        type="button"
        class="control__box"
        :aria-expanded="open"
        :aria-controls="`options-${label}`"
        @click="open ? (open = false) : openList()"
        @keydown="onKeydown"
        @blur="open = false">
        <span :class="{ 'control__placeholder': !selected }">
          {{ selected ? selected.label : placeholder }}
        </span>
      </button>
      <span class="control__chevron" aria-hidden="true">▾</span>
      <button
        v-if="modelValue"
        type="button"
        class="control__clear"
        :aria-label="`Clear ${label}`"
        @click="clear">×</button>
      <ul
        v-if="open && shown.length"
        :id="`options-${label}`"
        class="list"
        role="listbox">
        <li
          v-for="(option, index) in shown"
          :id="`option-${label}-${index}`"
          :key="option.value"
          class="list__option"
          :class="{ 'list__option--active': index === active }"
          role="option"
          :aria-selected="option.value === modelValue"
          @mousedown.prevent="choose(option)">
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
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
.control {
  position: relative;
}
/* One height and one border for every control, whether it is a button or a
   text field. */
.control__box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.75rem;
  padding: 0 3rem 0 .6rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 35%));
  border-radius: .25rem;
  background-color: var(--va-background-primary, #fff);
  color: var(--va-text-primary);
  font: inherit;
  font-size: .95rem;
  text-align: left;
  cursor: pointer;
}
input.control__box {
  cursor: text;
}
.control__box:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 1px;
}
.control__placeholder {
  color: var(--va-text-secondary);
}
.control__chevron {
  position: absolute;
  top: 50%;
  right: .7rem;
  transform: translateY(-50%);
  color: var(--va-text-secondary);
  font-size: .8rem;
  line-height: 1;
  pointer-events: none;
}
.control__clear {
  position: absolute;
  top: 50%;
  right: 1.8rem;
  transform: translateY(-50%);
  border: 0;
  background: none;
  color: var(--va-text-secondary);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}
.list {
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
.list__option {
  padding: .45rem .6rem;
  font-size: .95rem;
  cursor: pointer;
}
.list__option:hover,
.list__option--active {
  background: var(--va-background-element, rgb(0 0 0 / 6%));
}
</style>
