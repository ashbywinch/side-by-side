/**
 * Dev-only: remember which lab variant the reader is in, so the shelf keeps
 * its presentation after they follow a book and come back. The walker never
 * sees a switch — they simply return to the same catalogue.
 *
 * Removed with the lab route once the walkthrough chooses a variant.
 */
const KEY = "sbs:lab-variant";

export type LabVariant = "a" | "b" | "c";

export function isLabVariant(value: unknown): value is LabVariant {
  return value === "a" || value === "b" || value === "c";
}

export function rememberVariant(variant: unknown): void {
  if (!isLabVariant(variant)) return;
  try {
    window.localStorage.setItem(KEY, variant);
  } catch {
    // A blocked localStorage only costs the walker continuity.
  }
}

export function rememberedVariant(): LabVariant | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return isLabVariant(value) ? value : null;
  } catch {
    return null;
  }
}

export function layoutFor(variant: LabVariant): {
  shelfLayout: "section" | "rail";
  portrait: boolean;
} {
  return {
    shelfLayout: variant === "a" ? "section" : "rail",
    portrait: variant === "c",
  };
}
