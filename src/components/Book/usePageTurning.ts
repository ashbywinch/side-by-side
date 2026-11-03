import { onBeforeUnmount, onMounted, type Ref } from "vue";

import { AXIS_LOCK, swipeCommits, type PageTurn, type TurnSource } from "./pageTurn";

/** How long a swipe suppresses the synthetic click the browser sends after it. */
export const CLICK_GUARD_MS = 400;
/** A release velocity sample is stale after this long without a move. */
const VELOCITY_WINDOW_MS = 80;

const INTERACTIVE = "a, button, input, select, textarea, [contenteditable]";
const TEXT_ENTRY = "input, textarea, select, [contenteditable]";

export interface UsePageTurningArgs {
  /** The element that receives the swipe. */
  target: Ref<HTMLElement | null>;
  canTurn: (turn: PageTurn) => boolean;
  onTurn: (turn: PageTurn, source: TurnSource) => void;
  /** A horizontal drag has been locked: the page can start following it. */
  onDragStart?: () => void;
  /** The finger moved: follow it 1:1. `available` is false at a book end. */
  onDrag?: (turn: PageTurn, distance: number, available: boolean) => void;
  /**
   * The finger lifted. `commit` is true when the drag should complete a turn;
   * `onTurn` follows immediately in that case. Otherwise settle back.
   */
  onDragEnd?: (turn: PageTurn | null, distance: number, commit: boolean) => void;
}

function now(event: TouchEvent): number {
  const stamp = Number(event.timeStamp);
  if (Number.isFinite(stamp) && stamp > 0) return stamp;
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Touch swipes and arrow keys for paging. Touch is direct manipulation: once
 * the axis locks horizontal, the page follows the finger through `onDrag`, and
 * the release decides — a distance past the threshold or a flick in the
 * direction of travel commits; anything else settles back. The click the
 * browser synthesises at the end of a drag is swallowed so it cannot also
 * reveal a translation.
 */
export function usePageTurning({ target, canTurn, onTurn, onDragStart, onDrag, onDragEnd }: UsePageTurningArgs): void {
  let element: HTMLElement | null = null;
  let origin: { x: number; y: number; t: number } | null = null;
  let last: { x: number; t: number } | null = null;
  let velocity = 0;
  let axis: "none" | "horizontal" | "vertical" = "none";
  let dragTurn: PageTurn | null = null;
  let dragDistance = 0;
  let cancelled = false;
  let guard: ((event: MouseEvent) => void) | null = null;
  let guardTimer: ReturnType<typeof setTimeout> | null = null;

  function releaseGuard(): void {
    if (guard) window.removeEventListener("click", guard, true);
    guard = null;
    if (guardTimer !== null) {
      clearTimeout(guardTimer);
      guardTimer = null;
    }
  }

  function suppressNextClick(): void {
    releaseGuard();
    guard = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      releaseGuard();
    };
    window.addEventListener("click", guard, true);
    guardTimer = setTimeout(releaseGuard, CLICK_GUARD_MS);
  }

  function reset(): void {
    origin = null;
    last = null;
    velocity = 0;
    axis = "none";
    dragTurn = null;
    dragDistance = 0;
    cancelled = false;
  }

  function cancelDrag(): void {
    if (axis === "horizontal") onDragEnd?.(null, 0, false);
  }

  function onTouchStart(event: TouchEvent): void {
    reset();
    if (event.touches.length !== 1) {
      cancelled = true;
      return;
    }
    const start = event.target as Element | null;
    const interactive = start?.closest?.(INTERACTIVE);
    // The invisible margin targets are the one exception: a swipe started on
    // the edge is still a swipe, not a click on the button.
    if (interactive && !interactive.classList.contains("turn-target")) {
      cancelled = true;
      return;
    }
    const touch = event.touches[0];
    const t = now(event);
    origin = { x: touch.clientX, y: touch.clientY, t };
    last = { x: touch.clientX, t };
  }

  function onTouchMove(event: TouchEvent): void {
    if (!origin || cancelled) return;
    if (event.touches.length !== 1) {
      cancelDrag();
      cancelled = true;
      return;
    }

    const touch = event.touches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;

    if (axis === "none") {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        axis = "vertical";
        return;
      }
      axis = "horizontal";
      onDragStart?.();
    }
    if (axis !== "horizontal") return;

    const t = now(event);
    if (!last) {
      last = { x: touch.clientX, t };
    } else if (t - last.t >= 8) {
      velocity = (touch.clientX - last.x) / (t - last.t);
      last = { x: touch.clientX, t };
    }

    const turn: PageTurn = dx < 0 ? "next" : "previous";
    dragTurn = turn;
    dragDistance = Math.abs(dx);
    onDrag?.(turn, dragDistance, canTurn(turn));
  }

  function onTouchEnd(event: TouchEvent): void {
    if (!origin) {
      reset();
      return;
    }
    if (axis === "horizontal" && dragTurn) {
      const turn = dragTurn;
      const distance = dragDistance;
      const t = now(event);
      const fresh = last !== null && t - last.t <= VELOCITY_WINDOW_MS;
      const releaseVelocity = fresh ? velocity : 0;
      const commit = canTurn(turn) && swipeCommits(distance, releaseVelocity, turn);

      suppressNextClick();
      onDragEnd?.(turn, distance, commit);
      if (commit) onTurn(turn, "swipe");
    } else if (axis === "horizontal") {
      onDragEnd?.(null, 0, false);
    }
    reset();
  }

  function onTouchCancel(): void {
    cancelDrag();
    reset();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const start = event.target as Element | null;
    if (start?.closest?.(TEXT_ENTRY)) return;

    const turn: PageTurn | null =
      event.key === "ArrowRight" ? "next" : event.key === "ArrowLeft" ? "previous" : null;
    if (!turn || !canTurn(turn)) return;

    event.preventDefault();
    onTurn(turn, "key");
  }

  onMounted(() => {
    element = target.value;
    if (!element) return;
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: true });
    element.addEventListener("touchend", onTouchEnd, { passive: true });
    element.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("keydown", onKeydown);
  });

  onBeforeUnmount(() => {
    if (element) {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchCancel);
    }
    window.removeEventListener("keydown", onKeydown);
    releaseGuard();
  });
}
