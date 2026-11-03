/** A move to the previous or next page of a book. */
export type PageTurn = "previous" | "next";

/** What asked for the turn: the mechanism decides whether the hint is learned. */
export type TurnSource = "swipe" | "margin" | "key" | "pager";

/** How far a finger must travel horizontally before it is a swipe, in px. */
export const SWIPE_MIN_DISTANCE = 50;

/** How much more horizontal than vertical a swipe must be. */
export const SWIPE_AXIS_RATIO = 1.5;

/** A flick faster than this (px/ms) commits even if it did not travel 50px. */
export const FLICK_VELOCITY = 0.4;

/** The axis is locked once the finger has moved this far. */
export const AXIS_LOCK = 6;

export interface Point {
  x: number;
  y: number;
}

/**
 * The page a turn lands on, clamped to the book. A book with no pages, or an
 * unreadable current page, resolves to the first page rather than throwing.
 */
export function pageAfter(current: number, total: number, turn: PageTurn): number {
  const pages = Math.floor(Number(total));
  if (!Number.isFinite(pages) || pages < 1) return 1;

  const from = Math.min(pages, Math.max(1, Math.floor(Number(current)) || 1));
  return turn === "next" ? Math.min(pages, from + 1) : Math.max(1, from - 1);
}

/**
 * Classify a single-finger drag as a page turn. A swipe is horizontal-dominant
 * and travels far enough; everything else is a tap, a scroll or a selection.
 */
export function swipeTurn(start: Point, end: Point): PageTurn | null {
  const dx = Number(end.x) - Number(start.x);
  const dy = Number(end.y) - Number(start.y);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;

  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  if (horizontal < SWIPE_MIN_DISTANCE) return null;
  if (horizontal < vertical * SWIPE_AXIS_RATIO) return null;

  return dx < 0 ? "next" : "previous";
}

/**
 * Whether a released drag commits: far enough, or a flick fast enough in the
 * direction of travel. Velocity is signed px/ms, the same sign as dx.
 */
export function swipeCommits(distance: number, velocity: number, turn: PageTurn): boolean {
  if (!(distance > 0)) return false;
  if (distance >= SWIPE_MIN_DISTANCE) return true;
  return turn === "next" ? velocity <= -FLICK_VELOCITY : velocity >= FLICK_VELOCITY;
}
