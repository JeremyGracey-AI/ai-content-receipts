// Enforces non-negotiable rule #1 (spec §1.1) in code, not just in the prompt:
// no false certainty, no numeric AI percentage, never "this is real". Kept in a
// pure module (no server-only imports) so it is easy to unit-test.

// Any percentage, or a flat certainty word, is forbidden outright.
const PERCENT = /\d\s?%|\b\d{1,3}\s?percent\b/i;
const CERTAINTY = /\b(definitely|certainly|guaranteed|guarantee|a hundred percent)\b/i;

// An assertive "this is real / this photo is fake / it is genuine" claim. The
// subject is this/that/it/the, optionally followed by a short noun phrase.
const ASSERTION =
  /\b(?:this|that|it|the)(?:\s+\w+){0,2}\s+(?:is|was)\s+(?:real|fake|genuine|authentic|true)\b/i;

// Hedging/negation that makes an "is real/fake" mention safe (e.g. the required
// "no receipt does not mean it's real or fake" idea, or "we can't tell ...").
const HEDGE =
  /\b(not|n't|or fake|or real|if|whether|maybe|might|can ?not|can't|don'?t know|hard to|tell|unsure|seems|looks|probably|no receipt)\b/i;

/**
 * True if the copy makes a banned claim: a percentage, a certainty word, or an
 * assertive "this is real/fake" with no hedge in the same sentence.
 */
export function containsForbidden(text: string): boolean {
  if (PERCENT.test(text) || CERTAINTY.test(text)) return true;
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some((s) => ASSERTION.test(s) && !HEDGE.test(s));
}
