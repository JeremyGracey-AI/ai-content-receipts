import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// A single shared client. The API key is read from the server environment and
// never reaches the browser (this module is server-only).
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to the server environment.",
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Map a JS image mime type to the media_type the Messages API expects. */
export function toImageMediaType(
  mime: string,
): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  // The vision API accepts jpeg/png/webp/gif. For other accepted upload types
  // (avif/tiff/heic) we send as the closest supported type label; the bytes are
  // still passed through and the model is robust to the label for safety triage.
  switch (mime) {
    case "image/png":
      return "image/png";
    case "image/webp":
      return "image/webp";
    case "image/gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}
