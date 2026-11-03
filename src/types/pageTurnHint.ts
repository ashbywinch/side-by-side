export const PAGE_TURN_HINT_VERSION = 1;

/**
 * The reader's page-turn lesson, device-wide: how many times the hint has been
 * shown, and whether a swipe or a margin click has taught them the gesture.
 */
export interface PageTurnHint {
  version: typeof PAGE_TURN_HINT_VERSION;
  shown: number;
  turned: boolean;
}
