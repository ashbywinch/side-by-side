import { computed, nextTick, onUnmounted, ref, watch, type Ref } from "vue";

import type { ShelfCard } from "./shelfCards";

const STEP = 12;
const PHONE_QUERY = "(max-width: 599px)";

/**
 * Collapsed and expanded shelf counts, and the controls that move between them.
 *
 * The collapsed shelf is a preview: roughly one row on a desktop, two rows on a
 * phone. The expanded shelf starts at a page of twelve and grows by twelve.
 * The refs are passed in so the composable can keep focus and scroll anchored
 * to controls that live in the section's template.
 */
export function useShelfExpansion(
  cards: Ref<ShelfCard[]>,
  section: Ref<HTMLElement | null>,
  headerToggle: Ref<HTMLButtonElement | null>,
  bottomCollapse: Ref<HTMLButtonElement | null>,
) {
  const phoneQuery =
    typeof window !== "undefined" ? window.matchMedia?.(PHONE_QUERY) : undefined
  const phone = ref(phoneQuery?.matches ?? false)

  function onPhoneChange(event: MediaQueryListEvent): void {
    phone.value = event.matches
  }

  phoneQuery?.addEventListener?.("change", onPhoneChange)

  const preview = computed(() => (phone.value ? 4 : 6))
  const expanded = ref(false)
  const limit = ref(STEP)
  const isExpanded = computed(
    () => expanded.value && cards.value.length > preview.value,
  )
  const shown = computed(() =>
    cards.value.slice(
      0,
      isExpanded.value ? Math.max(limit.value, preview.value) : preview.value,
    ),
  )
  const remaining = computed(() =>
    Math.max(cards.value.length - shown.value.length, 0),
  )
  const nextStep = computed(() => Math.min(STEP, remaining.value))

  // If removals shrink the shelf to the preview size, forget the expansion;
  // restoring a book must not silently re-expand a shelf the reader collapsed.
  watch(
    () => cards.value.length,
    (count) => {
      if (count <= preview.value) expanded.value = false
    },
  )
  watch(preview, (count) => {
    if (cards.value.length <= count) expanded.value = false
  })

  function prefersReducedMotion(): boolean {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  }

  function scrollToShelf(): void {
    section.value?.scrollIntoView?.({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    })
  }

  function toggle(): void {
    if (isExpanded.value) {
      collapse()
      return
    }
    expanded.value = true
    limit.value = Math.min(cards.value.length, Math.max(STEP, preview.value))
    void nextTick(scrollToShelf)
  }

  function showMore(): void {
    const atEnd = limit.value + STEP >= cards.value.length
    limit.value = Math.min(cards.value.length, limit.value + STEP)
    if (atEnd) {
      // The control is removed once the last book is shown; keep the keyboard
      // user on a control that still exists.
      void nextTick(() => bottomCollapse.value?.focus())
    }
  }

  function collapse(): void {
    expanded.value = false
    limit.value = STEP
    void nextTick(() => {
      headerToggle.value?.focus()
      scrollToShelf()
    })
  }

  function reveal(index: number): void {
    if (!isExpanded.value) {
      expanded.value = true
      limit.value = Math.min(cards.value.length, Math.max(STEP, index + 1))
      return
    }
    if (index >= limit.value) {
      limit.value = Math.min(
        cards.value.length,
        Math.max(limit.value + STEP, index + 1),
      )
    }
  }

  onUnmounted(() => phoneQuery?.removeEventListener?.("change", onPhoneChange))

  return {
    preview,
    isExpanded,
    shown,
    remaining,
    nextStep,
    toggle,
    showMore,
    collapse,
    reveal,
  }
}
