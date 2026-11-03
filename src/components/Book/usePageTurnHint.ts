import { ref, type Ref } from "vue";

import { MAX_HINT_SHOWS, loadPageTurnHint, savePageTurnHint } from "./pageTurnHintStorage";

/** Quiet time after the first page renders before the lesson starts. */
export const HINT_DELAY_MS = 1200;
/** How long the lesson stays on screen: one gesture plus a beat to read it. */
export const HINT_HOLD_MS = 2600;

export interface PageTurnHintOptions {
  storage?: Storage | null;
  delayMs?: number;
  holdMs?: number;
}

export interface PageTurnHintView {
  visible: Ref<boolean>;
  /** Decide once per book open whether this reader gets the lesson. */
  consider(reading: { total: number; force?: boolean }): void;
  /** The reader turned a page by swipe or margin: the lesson worked. */
  learned(): void;
  /** Take the lesson down without claiming it was learned. */
  hide(): void;
  dispose(): void;
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The first-run page-turn lesson. State is per book open; the counts it reads
 * and writes are device-wide so the lesson survives leaving a book.
 */
export function createPageTurnHint(options: PageTurnHintOptions = {}): PageTurnHintView {
  const storage = options.storage === undefined ? safeStorage() : options.storage;
  const delayMs = options.delayMs ?? HINT_DELAY_MS;
  const holdMs = options.holdMs ?? HINT_HOLD_MS;

  const loaded = loadPageTurnHint(storage);
  let hint = loaded.hint;
  const writable = loaded.canWrite;

  const visible = ref(false);
  let considered = false;
  let dismissed = false;
  let disposed = false;
  let forced = false;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function persist(): void {
    if (writable) savePageTurnHint(storage, hint);
  }

  function clearTimers(): void {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (holdTimer !== null) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  function hide(): void {
    dismissed = true;
    clearTimers();
    visible.value = false;
  }

  function consider({ total, force = false }: { total: number; force?: boolean }): void {
    if (considered || disposed) return;
    considered = true;
    forced = force;

    if (total <= 1) return;
    if (!forced && (!writable || hint.turned || hint.shown >= MAX_HINT_SHOWS)) return;

    delayTimer = setTimeout(() => {
      delayTimer = null;
      if (disposed || dismissed) return;

      if (!forced) {
        hint = { ...hint, shown: Math.min(MAX_HINT_SHOWS, hint.shown + 1) };
        persist();
      }
      visible.value = true;

      holdTimer = setTimeout(() => {
        holdTimer = null;
        hide();
      }, holdMs);
    }, delayMs);
  }

  function learned(): void {
    if (disposed) return;
    if (!forced && writable && !hint.turned) {
      hint = { ...hint, turned: true };
      persist();
    }
    hide();
  }

  function dispose(): void {
    disposed = true;
    clearTimers();
  }

  return { visible, consider, learned, hide, dispose };
}

/** The lesson for one open of a book; the caller disposes it on unmount. */
export function usePageTurnHint(options: PageTurnHintOptions = {}): PageTurnHintView {
  return createPageTurnHint(options);
}
