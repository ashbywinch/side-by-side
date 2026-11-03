import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

import { pageMargins } from "./pageMargins";

export interface PageMarginWidths {
  previous: Ref<number | null>;
  next: Ref<number | null>;
}

/**
 * The horizontal translation currently applied to an element, in px. Margins
 * are measured while the page can be mid-turn (shifted by a row slide, a hint
 * nudge or a finger drag); `getBoundingClientRect` includes that transform, so
 * it must be subtracted or the invisible targets grow over the page.
 */
function translatedX(element: HTMLElement | null): number {
  if (!element) return 0;
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === "none") return 0;

  const match = transform.match(/^matrix(3d)?\(([^)]+)\)$/);
  if (!match) return 0;
  const parts = match[2].split(",").map(Number);
  const index = match[1] ? 12 : 4;
  const value = parts[index];
  return Number.isFinite(value) ? value : 0;
}

/**
 * The clickable margins around a page, measured from the text's box so the
 * target follows the card, the container gutter and the scrollbar. The page
 * passes its content element and the transformed reader; the composable keeps
 * the two widths current and free of transform drift.
 */
export function usePageMargins(
  content: Ref<HTMLElement | null>,
  reader?: Ref<HTMLElement | null>,
): PageMarginWidths {
  const previous = ref<number | null>(null);
  const next = ref<number | null>(null);
  let observer: ResizeObserver | null = null;
  let frame: number | null = null;

  function measure(): void {
    const element = content.value;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const shift = reader ? translatedX(reader.value) : 0;
    const margins = pageMargins(
      { left: rect.left - shift, right: rect.right - shift },
      document.documentElement.clientWidth,
    );
    previous.value = margins.previous;
    next.value = margins.next;
  }

  function schedule(): void {
    if (typeof requestAnimationFrame !== "function") {
      measure();
      return;
    }
    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      measure();
    });
  }

  watch(
    content,
    (element) => {
      observer?.disconnect();
      if (observer && element) observer.observe(element);
      schedule();
    },
    { flush: "post" },
  );

  onMounted(() => {
    schedule();
    window.addEventListener("resize", schedule);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      if (content.value) observer.observe(content.value);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", schedule);
    observer?.disconnect();
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  });

  return { previous, next };
}
