// Pure helpers for the voice "magic words" trigger. Kept free of browser APIs
// so the wake-phrase matching is unit-testable.

/** Lowercase, drop punctuation, collapse whitespace. */
export function normalizeTranscript(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Does the transcript contain the "magic words"? We match loosely so speech
 * recognition slip-ups still work: the user must ask for the "receipt(s)", plus
 * either say "mirror" twice (the incantation) or "show me".
 *
 * Matches, e.g.:
 *   "Mirror mirror in my hand, show me the receipts for this content"
 *   "show me the receipts for this image"
 */
export function isWakePhrase(transcript: string): boolean {
  const n = normalizeTranscript(transcript);
  if (!n.includes("receipt")) return false;
  const mirrorCount = (n.match(/\bmirror\b/g) || []).length;
  return mirrorCount >= 2 || n.includes("show me");
}
