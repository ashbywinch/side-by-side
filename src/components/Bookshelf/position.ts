/**
 * Pure page arithmetic. A page is a view over the book's segments, so it is
 * always derived from the stored position and the configured page size.
 */

function wholeNumber(value: number, fallback: number): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** 1-based page that holds the segment at the top of the viewport. */
export function pageForPosition(position: number, perPage: number): number {
  const size = wholeNumber(perPage, 0);
  const first = wholeNumber(position, 0);
  if (size <= 0 || first <= 0) return 1;
  return Math.floor(first / size) + 1;
}

/** First segment of a 1-based page. */
export function positionForPage(page: number, perPage: number): number {
  const size = wholeNumber(perPage, 0);
  const wanted = wholeNumber(page, 1);
  if (size <= 0 || wanted <= 1) return 0;
  return (wanted - 1) * size;
}

/** Keep a segment index inside a book of `segments` segments. */
export function clampPosition(position: number, segments: number): number {
  const length = wholeNumber(segments, 0);
  if (length <= 0) return 0;
  const wanted = wholeNumber(position, 0);
  return Math.min(Math.max(wanted, 0), length - 1);
}

/** A translation is uncovered when its segment is at or before the mark. */
export function isRevealed(revealedThrough: number, segment: number): boolean {
  return wholeNumber(segment, 0) <= revealedThrough;
}

/** The high-water mark only ever moves forward. */
export function nextRevealedThrough(current: number, segment: number): number {
  return Math.max(wholeNumber(current, -1), wholeNumber(segment, -1));
}

/**
 * Index of the last card whose top edge has passed the viewport's top edge —
 * the card the reader is looking at. `tops` is in document order.
 */
export function topSegment(tops: number[], topEdge = 8): number {
  let found = 0;
  for (let index = 0; index < tops.length; index += 1) {
    if (tops[index] <= topEdge) found = index;
    else break;
  }
  return found;
}
