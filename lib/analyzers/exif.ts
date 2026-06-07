import "server-only";
import exifr from "exifr";
import type { ExifFinding } from "@/lib/types";

// Reads EXIF metadata as *supporting context only*. EXIF is trivial to fake, so
// the copy must never treat it like a signed receipt (spec §5.3). Never throws.

export async function readExif(buffer: Buffer): Promise<ExifFinding | null> {
  try {
    // Pass a pick-list (Filter form): exifr enables only the segments needed
    // for these tags and skips GPS by default — good for privacy and speed.
    const data = await exifr.parse(buffer, [
      "Make",
      "Model",
      "DateTimeOriginal",
      "CreateDate",
      "Software",
    ]);

    if (!data) return null;

    const finding: ExifFinding = {
      cameraMake: str(data.Make),
      cameraModel: str(data.Model),
      takenAt: dateStr(data.DateTimeOriginal ?? data.CreateDate),
      software: str(data.Software),
    };

    const hasAny =
      finding.cameraMake ||
      finding.cameraModel ||
      finding.takenAt ||
      finding.software;
    return hasAny ? finding : null;
  } catch {
    return null;
  }
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function dateStr(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  return str(v);
}
