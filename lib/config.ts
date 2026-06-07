// Central configuration. Keep all tunables here so behavior is easy to audit.

/**
 * The explanation layer uses the current Claude Sonnet model by design (spec
 * §5.6) — fast, plain rewriting at an 8th-grade level. The safety gate uses a
 * vision-capable model to classify before any analysis runs (spec §6).
 *
 * Model strings are exact and carry no date suffix.
 */
export const EXPLANATION_MODEL =
  process.env.RECEIPTS_EXPLANATION_MODEL || "claude-sonnet-4-6";

export const SAFETY_MODEL =
  process.env.RECEIPTS_SAFETY_MODEL || "claude-sonnet-4-6";

/** The reading-level ceiling for all user-facing copy (spec §3, §5.7). */
export const MAX_FK_GRADE = 8;

/** How many times the explanation layer may try to simplify before giving up. */
export const MAX_SIMPLIFY_ATTEMPTS = 3;

/** Reject uploads larger than this. Images only; processed in memory. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/** Image types we accept (spec §5.1). */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/heic",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export function isAcceptedImageType(t: string): t is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(t);
}
