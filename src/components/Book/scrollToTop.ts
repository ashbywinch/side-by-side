/** How long a smooth scroll may take before it is snapped to the top. */
export const SMOOTH_SCROLL_FALLBACK_MS = 600;

export interface ScrollToTopOptions {
  /** How far the reader is scrolled down, in px. */
  distance: number;
  /** The viewport height, in px. */
  viewportHeight: number;
  reducedMotion: boolean;
}

/**
 * A turn replaces the content before scrolling, so a long smooth scroll would
 * fly through the new page's unread text. Short turns get the polish; long ones
 * snap, and reduced motion always snaps.
 */
export function scrollBehaviorFor(distance: number, viewportHeight: number, reducedMotion: boolean): ScrollBehavior {
  if (reducedMotion) return "auto";
  if (!(distance > 0) || !(viewportHeight > 0)) return "auto";
  return distance <= viewportHeight ? "smooth" : "auto";
}

/**
 * Scroll to the top of the page after a turn and return a cancel function for
 * the fallback timer. If the browser's smooth scroll has not arrived within
 * `SMOOTH_SCROLL_FALLBACK_MS`, the reader gets a snap rather than a wait.
 */
export function scrollToTop({ distance, viewportHeight, reducedMotion }: ScrollToTopOptions): () => void {
  const behavior = scrollBehaviorFor(distance, viewportHeight, reducedMotion);
  window.scrollTo({ top: 0, behavior });

  if (behavior !== "smooth") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    timer = null;
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });
  }, SMOOTH_SCROLL_FALLBACK_MS);

  return () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
}
