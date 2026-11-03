/**
 * The smallest margin that still reads as a target. WCAG 2.5.8 asks for 24px;
 * below this the margin is hidden and the reader swipes, tabs or uses the pager.
 */
export const MIN_TARGET = 24;

export interface ContentBox {
  left: number;
  right: number;
}

export interface PageMargins {
  /** Width of the target left of the text, or null when it is too narrow. */
  previous: number | null;
  /** Width of the target right of the text, or null when it is too narrow. */
  next: number | null;
}

/**
 * The clickable margin is the distance from the viewport edge to the text, so
 * it includes the container gutter and the card's padding. Measured rather
 * than assumed: the card width, the gutter and the scrollbar all move it.
 */
export function pageMargins(content: ContentBox, viewportWidth: number, min = MIN_TARGET): PageMargins {
  const width = Math.floor(Number(viewportWidth));
  const previous = Math.floor(Number(content.left));
  const next = Math.floor(width - Number(content.right));

  return {
    previous: Number.isFinite(previous) && previous >= min ? previous : null,
    next: Number.isFinite(next) && next >= min ? next : null,
  };
}
