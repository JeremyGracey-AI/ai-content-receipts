import "server-only";
import { getAnthropic } from "@/lib/anthropic";
import { EXPLANATION_MODEL, MAX_FK_GRADE, MAX_SIMPLIFY_ATTEMPTS } from "@/lib/config";
import { gradeCopy } from "@/lib/readability";
import { imageFallback } from "@/lib/copy/templates";
import { containsForbidden } from "@/lib/forbidden";
import type { ExplanationBlocks, ImageFindings, ReceiptStatus } from "@/lib/types";

// The explanation layer (spec §5.6) turns structured findings into the three
// plain-language blocks, then enforces the readability gate (spec §5.7). If the
// model cannot produce copy at an 8th-grade level after a few tries — or breaks
// a non-negotiable rule — we fall back to a pre-written plain template.

const SYSTEM = [
  "You explain image-provenance findings to a teen at an 8th-grade reading level.",
  "You are a media-literacy coach, not a detector. Teach a habit; do not hand down a verdict.",
  "RULES (these are hard):",
  "- Use short sentences and plain, everyday words. No jargon.",
  "- Never say a file 'is real'. Never give a percentage or a confidence number.",
  "- 'No receipt' is normal and is NOT proof of real or fake. Say so plainly when there is no receipt.",
  "- A receipt (Content Credential) is a signed proof of origin. EXIF (camera info) is easy to fake, so treat it as a weak hint only.",
  "- Always explain 'why' in one or two short sentences so the reader learns something they can reuse.",
  "Return only the structured output with the three blocks.",
].join("\n");

const SCHEMA = {
  type: "object",
  properties: {
    receiptPlain: {
      type: "string",
      description: "Block 1: does it carry proof of origin? One plain sentence.",
    },
    signsItems: {
      type: "array",
      items: { type: "string" },
      description: "Block 2: short, plain findings. Each a short sentence.",
    },
    signsPlain: {
      type: "string",
      description: "Block 2 summary: one or two plain sentences. Explain why.",
    },
    nextSteps: {
      type: "array",
      items: { type: "string" },
      description: "Block 3: 2-4 plain habits to do next.",
    },
  },
  required: ["receiptPlain", "signsItems", "signsPlain", "nextSteps"],
  additionalProperties: false,
} as const;

export async function explainImage(
  findings: ImageFindings,
  receiptStatus: ReceiptStatus,
): Promise<ExplanationBlocks> {
  const fallback = imageFallback(findings);

  let attempt = 0;
  let lastTry: ExplanationBlocks | null = null;
  let lastGrade = Infinity;

  while (attempt < MAX_SIMPLIFY_ATTEMPTS) {
    attempt += 1;
    let blocks: ExplanationBlocks;
    try {
      blocks = await callModel(findings, receiptStatus, lastTry, lastGrade);
    } catch {
      return fallback; // API error — ship the safe template.
    }

    if (breaksRules(blocks)) {
      // A hard-rule break is not something to "simplify"; use the template.
      return fallback;
    }

    const grade = gradeBlocks(blocks);
    if (grade <= MAX_FK_GRADE) return blocks;

    lastTry = blocks;
    lastGrade = grade;
  }

  // Still too hard after the loop — ship the plain template instead.
  return fallback;
}

async function callModel(
  findings: ImageFindings,
  receiptStatus: ReceiptStatus,
  previous: ExplanationBlocks | null,
  previousGrade: number,
): Promise<ExplanationBlocks> {
  const client = getAnthropic();

  const userParts: string[] = [
    "Here are the structured findings for one image. Write the three blocks.",
    `The receipt status is: ${receiptStatus} (yes = signed receipt found, no = none, unsure = receipt found but seal broken or signer unknown).`,
    "Findings JSON:",
    JSON.stringify(toModelFindings(findings), null, 2),
  ];

  if (previous) {
    userParts.push(
      "",
      `Your last version scored grade ${previousGrade.toFixed(1)}, which is too hard.`,
      "Rewrite it simpler: shorter sentences, more common words. Keep the same meaning.",
      "Your last version was:",
      JSON.stringify(previous, null, 2),
    );
  }

  const response = await client.messages.create({
    model: EXPLANATION_MODEL,
    max_tokens: 800,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: userParts.join("\n") }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text block in explanation response");
  }
  const parsed = JSON.parse(text.text) as ExplanationBlocks;

  // Normalize shape defensively.
  return {
    receiptPlain: String(parsed.receiptPlain ?? "").trim(),
    signsItems: Array.isArray(parsed.signsItems)
      ? parsed.signsItems.map((s) => String(s).trim()).filter(Boolean)
      : [],
    signsPlain: String(parsed.signsPlain ?? "").trim(),
    nextSteps: Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
}

/** A compact, model-friendly view of the findings (no internal flags). */
function toModelFindings(f: ImageFindings) {
  return {
    receipt: {
      found: f.provenance.present,
      sealValid: f.provenance.valid,
      toolNamed: f.provenance.claimGenerator,
      aiSignals: f.provenance.aiSignals,
      editHistory: f.provenance.actions,
    },
    cameraInfo: f.exif
      ? {
          make: f.exif.cameraMake,
          model: f.exif.cameraModel,
          takenAt: f.exif.takenAt,
          software: f.exif.software,
          note: "Camera info is easy to fake; treat as a weak hint.",
        }
      : null,
    hiddenWatermark: {
      checked: f.watermark.checked,
      found: f.watermark.found,
      note: "Not finding one proves nothing.",
    },
  };
}

function gradeBlocks(blocks: ExplanationBlocks): number {
  return gradeCopy({
    sentences: [blocks.receiptPlain, blocks.signsPlain, ...blocks.nextSteps],
    itemGroups: [blocks.signsItems],
  });
}

/** Enforce non-negotiable rule #1 in code, not just in the prompt (spec §1). */
export function breaksRules(blocks: ExplanationBlocks): boolean {
  const all = [
    blocks.receiptPlain,
    blocks.signsPlain,
    ...blocks.signsItems,
    ...blocks.nextSteps,
  ].join(" ");
  return containsForbidden(all);
}
