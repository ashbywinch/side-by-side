<script setup lang="ts">
import type { PageTurn } from "./pageTurn";

const props = defineProps<{
  /** Width of the left margin in px, or null when it is too narrow to use. */
  previous: number | null;
  /** Width of the right margin in px, or null when it is too narrow to use. */
  next: number | null;
  canPrevious: boolean;
  canNext: boolean;
}>();

const emit = defineEmits<{ turn: [turn: PageTurn] }>();

/**
 * A margin is empty space, so the click is a page turn unless the reader is
 * using it for something else: opening a link in a new tab, extending a
 * selection, or clearing one.
 */
function onClick(turn: PageTurn, event: MouseEvent): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (window.getSelection?.()?.toString()) return;
  emit("turn", turn);
}
</script>

<template>
  <button
    v-show="props.previous !== null"
    type="button"
    class="turn-target turn-target--previous"
    :style="props.previous !== null ? { width: `${props.previous}px` } : undefined"
    :disabled="!props.canPrevious"
    aria-label="Previous page"
    @click="onClick('previous', $event)"
  >
    <span class="turn-target__cue" aria-hidden="true" />
  </button>
  <button
    v-show="props.next !== null"
    type="button"
    class="turn-target turn-target--next"
    :style="props.next !== null ? { width: `${props.next}px` } : undefined"
    :disabled="!props.canNext"
    aria-label="Next page"
    @click="onClick('next', $event)"
  >
    <span class="turn-target__cue" aria-hidden="true" />
  </button>
</template>

<style scoped>
/* Invisible by design: the hint teaches the gesture, focus reveals the control. */
.turn-target {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.turn-target--previous {
  left: 0;
}
.turn-target--next {
  right: 0;
}
.turn-target:disabled {
  cursor: default;
}
.turn-target:focus-visible {
  outline: none;
}
.turn-target__cue {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: var(--va-background-primary, #fff);
  box-shadow: var(--va-card-box-shadow, 0 2px 10px rgb(0 0 0 / 12%));
  opacity: 0;
  transition: opacity 0.15s ease;
}
.turn-target__cue::before {
  content: "";
  display: block;
  width: 0.55rem;
  height: 0.55rem;
  margin: 0.65rem auto;
  border-top: 2px solid var(--va-primary);
  border-right: 2px solid var(--va-primary);
  transform: rotate(45deg);
}
.turn-target--previous .turn-target__cue::before {
  transform: rotate(-135deg);
}
.turn-target:focus-visible .turn-target__cue {
  opacity: 1;
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .turn-target__cue {
    transition: none;
  }
}
</style>
