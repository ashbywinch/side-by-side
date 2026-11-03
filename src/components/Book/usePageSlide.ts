import type { Ref } from "vue";

import { prefersReducedMotion } from "@/components/motion";
import type { PageTurn } from "./pageTurn";

/** How long a page turn takes. Keep in step with the CSS. */
export const PAGE_SLIDE_MS = 360;
/** A safety net if the route never lands. */
const SAFETY_MS = 2000;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

export interface PageSlideArgs {
  /** The fixed, clipped layer that holds the outgoing page's snapshot. */
  ghost: Ref<HTMLElement | null>;
  /** The live page wrapper that slides in for a committed drag. */
  reader: Ref<HTMLElement | null>;
  /** The page card to snapshot, or null before the first render. */
  card: () => HTMLElement | null;
  reducedMotion?: () => boolean;
}

export interface PageSlide {
  /** Snapshot the page that is on screen before the route swaps it. */
  begin(dragOffset?: number): void;
  /** Slide the snapshot off and the new page to rest, in one row. */
  play(direction: PageTurn): void;
  /** Drop the snapshot, classes and animations. */
  end(): void;
}

interface Running {
  cancel: () => void;
}

function viewportWidth(): number {
  return document.documentElement.clientWidth || window.innerWidth;
}

/**
 * A literal transform animation: no custom properties in the keyframes. A
 * `var()` inside `@keyframes` makes Chromium run the animation on the main
 * thread (Chromium issue 40890539), so a busy main thread — exactly what a
 * page render causes — drops its frames. Literal `translateX` keyframes are
 * composited and stay smooth while the new page paints.
 */
function animateTransform(element: HTMLElement, from: number, to: number, duration: number): Running {
  if (typeof element.animate === "function") {
    const animation = element.animate(
      [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
      { duration, easing: EASING, fill: "both" },
    );
    // The animation owns the transform; the inline start must not fight it.
    element.style.transform = "";
    return { cancel: () => animation.cancel() };
  }

  // Very old browsers without WAAPI: a transition is the best available.
  element.style.transition = "none";
  element.style.transform = `translateX(${from}px)`;
  void element.offsetWidth;
  element.style.transition = `transform ${duration}ms ${EASING}`;
  element.style.transform = `translateX(${to}px)`;
  return {
    cancel: () => {
      element.style.transition = "none";
      element.style.transform = "";
    },
  };
}

/**
 * The turn is one row of pages moving. The outgoing page is frozen in the
 * viewport; the incoming page starts where the drag peek left it and both
 * travel the same distance, so the seam between them never changes. For a
 * control turn the row starts with no drag offset.
 */
export function createPageSlide({
  ghost,
  reader,
  card,
  reducedMotion = prefersReducedMotion,
}: PageSlideArgs): PageSlide {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let token = 0;
  let offset = 0;
  let ghostAnimation: Running | null = null;
  let readerAnimation: Running | null = null;

  function clear(keepLive = false): void {
    ghostAnimation?.cancel();
    ghostAnimation = null;
    readerAnimation?.cancel();
    readerAnimation = null;

    const overlay = ghost.value;
    overlay?.classList.remove("page-ghost--out");
    overlay?.replaceChildren();
    if (overlay) {
      overlay.style.transform = "";
      overlay.style.transition = "";
    }

    const live = reader.value;
    if (!live || keepLive) return;
    live.classList.remove("reader--turn-next", "reader--turn-previous");
    live.style.transition = "";
    live.style.transform = "";
  }

  function stop(keepLive: boolean): void {
    token += 1;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    offset = 0;
    clear(keepLive);
  }

  function end(): void {
    stop(false);
  }

  function begin(dragOffset = 0): void {
    // Measure and clone the outgoing page *before* the reset below: the drag
    // transform is still applied to the reader, so the snapshot freezes where
    // the finger left the page. Resetting first would measure the page at
    // rest, and the page would jump back by the drag distance on release.
    const element = card();
    const overlay = ghost.value;
    const rect = element && overlay ? element.getBoundingClientRect() : null;
    const snapshot =
      element && rect && rect.width > 0 && rect.height > 0
        ? (element.cloneNode(true) as HTMLElement)
        : null;

    // The live page keeps following the finger until the row takes over: the
    // route needs a few frames to land, and resetting it here would leave the
    // page sitting at rest behind the snapshot for that whole window.
    stop(true);
    if (reducedMotion() || !snapshot || !overlay || !rect) return;

    snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    snapshot.removeAttribute("id");
    snapshot.style.position = "absolute";
    snapshot.style.left = `${rect.left}px`;
    snapshot.style.top = `${rect.top}px`;
    snapshot.style.width = `${rect.width}px`;
    snapshot.style.height = `${rect.height}px`;
    snapshot.style.margin = "0";
    snapshot.style.pointerEvents = "none";
    overlay.replaceChildren(snapshot);
    offset = Math.max(0, Math.min(dragOffset, viewportWidth()));

    // If the route never lands (a rejected navigation), never leave the
    // snapshot covering the reader.
    timer = setTimeout(() => {
      timer = null;
      end();
    }, SAFETY_MS);
  }

  function play(direction: PageTurn): void {
    const overlay = ghost.value;
    if (!overlay || overlay.childElementCount === 0) return;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    const travel = Math.max(0, viewportWidth() - offset);
    const ghostTo = direction === "next" ? -travel : travel;
    ghostAnimation = animateTransform(overlay, 0, ghostTo, PAGE_SLIDE_MS);
    overlay.classList.add("page-ghost--out");

    const live = reader.value;
    if (live) {
      live.classList.remove("reader--turn-next", "reader--turn-previous");
      void live.offsetWidth;
      live.classList.add(direction === "next" ? "reader--turn-next" : "reader--turn-previous");
      readerAnimation = animateTransform(live, -ghostTo, 0, PAGE_SLIDE_MS);
    }

    const current = ++token;
    timer = setTimeout(() => {
      timer = null;
      if (current !== token) return;
      clear();
    }, PAGE_SLIDE_MS + 80);
  }

  return { begin, play, end };
}
