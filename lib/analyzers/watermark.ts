import type { WatermarkFinding } from "@/lib/types";

// Best-effort, honest watermark check (spec §5.4).
//
// Some generators embed invisible watermarks (e.g. SynthID). General-purpose
// detection of these is NOT openly available to a solo builder. So we always
// "check", but we do not claim a verdict: not finding a watermark is reported
// as "we couldn't find a receipt", never as "real".
//
// This function exists as the seam where a real detector would plug in later.
// Until then it honestly reports that nothing was found.
export function checkWatermark(_buffer: Buffer): WatermarkFinding {
  return { checked: true, found: false };
}
