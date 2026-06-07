// Prepares image bytes for the vision (safety) call.
//
// The Claude vision API accepts JPEG/PNG/WebP/GIF and validates the bytes
// against the declared media type. We accept a wider set on upload (AVIF, TIFF,
// HEIC — HEIC is the iPhone default), so here we transcode those to JPEG in
// memory before the call. If the bytes cannot be made vision-safe we return
// null, and the caller fails closed (no analysis). Nothing is persisted/logged.
//
// Kept free of "server-only" so the prepare logic is unit-testable.

export type VisionMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export type PreparedImage = { data: string; mediaType: VisionMediaType };

const PASSTHROUGH: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function prepareImageForVision(
  buffer: Buffer,
  mime: string,
): Promise<PreparedImage | null> {
  // Formats the vision API already accepts: send as-is.
  if (PASSTHROUGH.includes(mime)) {
    return { data: buffer.toString("base64"), mediaType: mime as VisionMediaType };
  }

  // HEIC/HEIF: decode with a dedicated decoder (libheif via wasm), emit JPEG.
  if (mime === "image/heic" || mime === "image/heif") {
    try {
      const heicConvert = (await import("heic-convert")).default;
      const out = await heicConvert({ buffer, format: "JPEG", quality: 0.92 });
      return { data: Buffer.from(out).toString("base64"), mediaType: "image/jpeg" };
    } catch {
      // HEIC decode unavailable or failed — let the caller fail closed.
      return null;
    }
  }

  // AVIF, TIFF, or anything else we accepted on upload: transcode via sharp.
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
    return { data: out.toString("base64"), mediaType: "image/jpeg" };
  } catch {
    return null;
  }
}
