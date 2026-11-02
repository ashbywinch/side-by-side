/** The gap between the author line and the remove control. */
export const REMOVE_GAP = 4;

export interface AuthorLine {
  /** The card's top edge, in viewport coordinates. */
  top: number;
  /** The author line's bottom edge, in viewport coordinates. */
  bottom: number;
}

/**
 * The remove overlay's top, relative to a card's top.
 *
 * Titles wrap to different line counts, so the author line does not sit at the
 * same height on every card. Aligning the overlay below the lowest author line
 * in the row gives every card one Y without moving the author or growing the
 * card.
 */
export function removeTop(lines: AuthorLine[]): number {
  const lowest = lines.reduce(
    (max, line) => Math.max(max, line.bottom - line.top),
    0,
  )
  return lowest > 0 ? Math.round(lowest + REMOVE_GAP) : 0
}
