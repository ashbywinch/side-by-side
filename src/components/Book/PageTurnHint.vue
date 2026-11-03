<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** Width of the left margin in px; null means no previous page to teach. */
  previous: number | null;
  /** Width of the right margin in px; null means no next page to teach. */
  next: number | null;
  visible: boolean;
  /** A coarse pointer swipes the page; a fine one clicks the margin. */
  coarse: boolean;
}>();

const show = computed(() => props.visible && (props.coarse ? props.next !== null : true));

/** The hand sits just inside the page's right edge; the next page is that way. */
const handRight = computed(() => `${(props.next ?? 0) + 8}px`);

function targetStyle(width: number): Record<string, string> {
  return { width: `${width}px` };
}
</script>

<template>
  <Transition name="turn-hint">
    <div v-if="show" class="turn-hint" aria-hidden="true">
      <template v-if="!props.coarse">
        <!-- A fine pointer gets the click grammar: the margin is the target. -->
        <span
          v-if="props.previous !== null"
          class="turn-hint__target turn-hint__target--previous"
          :style="targetStyle(props.previous)"
        />
        <span
          v-if="props.next !== null"
          class="turn-hint__target turn-hint__target--next"
          :style="targetStyle(props.next)"
        />

        <!-- Image and words together, at the target they describe. -->
        <span v-if="props.next !== null" class="turn-hint__click-cue">
          <span class="turn-hint__label">Click the margin to turn the page</span>
          <span class="turn-hint__mouse-wrap">
            <span class="turn-hint__ring" />
            <span class="turn-hint__ring turn-hint__ring--late" />
            <span class="turn-hint__mouse material-icons">mouse</span>
          </span>
        </span>
      </template>

      <!-- A coarse pointer gets hint motion: the page itself is nudged left. -->
      <template v-else>
        <span class="turn-hint__hand material-icons" :style="{ right: handRight }">touch_app</span>
        <p class="turn-hint__caption">Swipe left for the next page</p>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.turn-hint {
  position: fixed;
  inset: 0;
  z-index: 9;
  pointer-events: none;
}
/* The click target itself, clearly lit for the whole hint. */
.turn-hint__target {
  position: absolute;
  top: 20vh;
  bottom: 20vh;
  background: var(--va-primary);
  opacity: 0.18;
  animation: turn-hint-target 400ms ease-out 0.1s 1 both;
}
.turn-hint__target--previous {
  left: 0;
  border-radius: 0 1rem 1rem 0;
}
.turn-hint__target--next {
  right: 0;
  border-radius: 1rem 0 0 1rem;
}
/*
 * Hint motion. The hand and the page move together: press, drag left, hold,
 * then the finger lifts and the page eases back. The hand never snaps back to
 * its resting position — it fades out at the end of the drag.
 */
.turn-hint__hand {
  position: absolute;
  top: 55%;
  font-size: 2rem;
  line-height: 1;
  color: var(--va-primary);
  animation: turn-hint-hand 1500ms 100ms 1 both;
}
/* The click cue: cursor and words in one chip, inside the lit margin. */
.turn-hint__click-cue {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.55rem;
  max-width: calc(100% - 1rem);
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 20%));
  border-radius: 999px;
  background: var(--va-background-secondary, #fff);
  background: color-mix(in srgb, var(--va-background-secondary, #fff) 80%, transparent);
  box-shadow: var(--va-card-box-shadow, 0 2px 10px rgb(0 0 0 / 12%));
  color: var(--va-text-secondary, #555);
  font-size: 0.9rem;
  line-height: 1.2;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}
.turn-hint__mouse-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  color: var(--va-primary);
  animation: turn-hint-press 1300ms ease-in-out 100ms 1 both;
}
.turn-hint__mouse {
  position: relative;
  font-size: 1.5rem;
  line-height: 1;
}
.turn-hint__ring {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  border: 1.5px solid currentColor;
  border-radius: 999px;
  opacity: 0;
  animation: turn-hint-ring 1300ms ease-out 100ms 1 both;
}
.turn-hint__ring--late {
  animation-delay: 500ms;
}
/* The swipe caption, in the snackbar position: the moving page is the
   demonstration, the words name it. */
.turn-hint__caption {
  position: absolute;
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
  margin: 0;
  padding: 0.55rem 0.95rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 20%));
  border-radius: 999px;
  background: var(--va-background-secondary, #fff);
  background: color-mix(in srgb, var(--va-background-secondary, #fff) 80%, transparent);
  box-shadow: var(--va-card-box-shadow, 0 2px 10px rgb(0 0 0 / 12%));
  color: var(--va-text-secondary, #555);
  font-size: 0.9rem;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}
/* A quiet fade so the hint does not vanish mid-thought. */
.turn-hint-enter-active,
.turn-hint-leave-active {
  transition: opacity 180ms ease;
}
.turn-hint-enter-from,
.turn-hint-leave-to {
  opacity: 0;
}
@keyframes turn-hint-hand {
  0% {
    opacity: 0;
    transform: translateX(0);
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  12% {
    opacity: 1;
    transform: translateX(-8px);
    animation-timing-function: cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  56% {
    transform: translateX(-56px);
    animation-timing-function: linear;
  }
  70% {
    opacity: 1;
    transform: translateX(-56px);
    animation-timing-function: ease-out;
  }
  84%,
  100% {
    opacity: 0;
    transform: translateX(-56px);
  }
}
@keyframes turn-hint-press {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  20% {
    opacity: 1;
    transform: scale(0.82);
  }
  45% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes turn-hint-ring {
  0% {
    opacity: 0.45;
    transform: scale(0.5);
  }
  60%,
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}
@keyframes turn-hint-target {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.18;
  }
}
@media (prefers-reduced-motion: reduce) {
  .turn-hint-enter-active,
  .turn-hint-leave-active {
    transition: none;
  }
  .turn-hint__hand,
  .turn-hint__mouse-wrap,
  .turn-hint__ring,
  .turn-hint__target {
    animation: none;
  }
  .turn-hint__hand {
    opacity: 1;
  }
  .turn-hint__target {
    opacity: 0.18;
  }
  .turn-hint__ring {
    opacity: 0.35;
  }
}
</style>
