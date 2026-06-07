import "server-only";
import { readContentCredentials } from "@/lib/analyzers/c2pa";
import { readExif } from "@/lib/analyzers/exif";
import { checkWatermark } from "@/lib/analyzers/watermark";
import { explainImage } from "@/lib/explain";
import type { ImageFindings, ReceiptStatus, Result } from "@/lib/types";

// The image path — the only "upload and the app analyzes" flow (spec §5).
// The safety gate runs BEFORE this, in the route handler.

export async function analyzeImage(
  buffer: Buffer,
  mime: string,
): Promise<Result> {
  const [provenance, exif] = await Promise.all([
    readContentCredentials(buffer, mime),
    readExif(buffer),
  ]);
  const watermark = checkWatermark(buffer);

  const findings: ImageFindings = { provenance, exif, watermark };

  // Map provenance to receipt status (spec §5.2):
  //   manifest + valid seal -> yes
  //   manifest + broken/unknown seal -> unsure
  //   no manifest -> no
  const receiptStatus: ReceiptStatus = provenance.present
    ? provenance.valid === true
      ? "yes"
      : "unsure"
    : "no";

  const blocks = await explainImage(findings, receiptStatus);

  return {
    modality: "image",
    receipt: { status: receiptStatus, plain: blocks.receiptPlain },
    signs: { items: blocks.signsItems, plain: blocks.signsPlain },
    nextSteps: blocks.nextSteps,
    // A receipt "exists" if any manifest was found, even a broken one. Only a
    // true absence triggers the "no receipt" line on the image path.
    hasProvenance: provenance.present,
  };
}
