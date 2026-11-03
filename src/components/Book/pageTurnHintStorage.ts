import { PAGE_TURN_HINT_VERSION, type PageTurnHint } from "@/types/pageTurnHint";

export const PAGE_TURN_HINT_KEY = "sbs:page-turn-hint:v1";
export const MAX_HINT_SHOWS = 3;

export interface PageTurnHintLoad {
  hint: PageTurnHint;
  /** False when the stored data is from a newer schema we must not overwrite. */
  canWrite: boolean;
}

function blank(): PageTurnHint {
  return { version: PAGE_TURN_HINT_VERSION, shown: 0, turned: false };
}

/** A newer schema outranks this one: suppress the hint rather than reset it. */
function unreadable(): PageTurnHintLoad {
  return { hint: { ...blank(), shown: MAX_HINT_SHOWS }, canWrite: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toShown(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_HINT_SHOWS, Math.floor(value));
}

export function loadPageTurnHint(storage: Storage | null): PageTurnHintLoad {
  if (!storage) return { hint: blank(), canWrite: true };

  let raw: string | null;
  try {
    raw = storage.getItem(PAGE_TURN_HINT_KEY);
  } catch {
    return { hint: blank(), canWrite: true };
  }
  if (!raw) return { hint: blank(), canWrite: true };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Unreadable data cannot be repaired; let the next write replace it.
    return { hint: blank(), canWrite: true };
  }
  if (!isRecord(parsed)) return { hint: blank(), canWrite: true };
  if (parsed.version !== PAGE_TURN_HINT_VERSION) return unreadable();

  return {
    hint: {
      version: PAGE_TURN_HINT_VERSION,
      shown: toShown(parsed.shown),
      turned: parsed.turned === true,
    },
    canWrite: true,
  };
}

export function savePageTurnHint(storage: Storage | null, hint: PageTurnHint): void {
  if (!storage) return;
  try {
    storage.setItem(PAGE_TURN_HINT_KEY, JSON.stringify(hint));
  } catch {
    // A full or denied store must never break reading.
  }
}
