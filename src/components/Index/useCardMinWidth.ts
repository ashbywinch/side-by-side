import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

const CARD = ".item";
/** A book is about two-thirds as wide as it is tall. */
export const BOOK_RATIO = 2 / 3;

/**
 * The width floor a card needs to still read as a book: two-thirds of its row's
 * height. CSS cannot express that — the row's height is produced by the
 * content, so there is no unit for "the height my row ends up". Measure it,
 * apply it, and measure once more because a wider card wraps into fewer lines
 * and so gets shorter.
 */
const GAP = 16;

/**
 * The width floor: a book's proportion of the row's height, but never so wide
 * that two cards stop fitting side by side.
 */
export function cardFloor(height: number, availableWidth: number): number {
  const bookish = Math.round(height * BOOK_RATIO);
  const twoAcross = Math.floor((availableWidth - GAP) / 2);
  return Math.max(0, Math.min(bookish, twoAcross));
}

export function useCardMinWidth(container: Ref<HTMLElement | null>) {
  const minWidth = ref(0);
  let observer: ResizeObserver | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function tallest(): number {
    const element = container.value;
    if (!element) return 0;
    const cards = Array.from(element.querySelectorAll<HTMLElement>(CARD));
    return cards.reduce(
      (max, card) => Math.max(max, card.getBoundingClientRect().height),
      0,
    );
  }

  function nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  async function settle() {
    // First pass: the tall, narrow layout. Second: after widening — and after
    // the browser has painted the wider cards, or the re-measure reads the old
    // wrapped height.
    for (let pass = 0; pass < 2; pass += 1) {
      const height = tallest();
      if (height <= 0) return;
      // A book proportion, but never so wide that a phone can only show one.
      minWidth.value = cardFloor(height, container.value?.clientWidth ?? 0);
      await nextFrame();
    }
  }

  function schedule() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void settle();
    }, 50);
  }

  onMounted(() => {
    void settle();
    if (typeof ResizeObserver !== "undefined" && container.value) {
      observer = new ResizeObserver(schedule);
      observer.observe(container.value);
    }
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    if (timer !== null) clearTimeout(timer);
  });

  return minWidth;
}
