import "server-only";
import { getAnthropic, toImageMediaType } from "@/lib/anthropic";
import { SAFETY_MODEL } from "@/lib/config";

// The content-safety gate (spec §6). Runs FIRST, before any analysis or modality
// routing. If it flags possible intimate/nude content involving a minor, the
// caller must stop immediately: no provenance read, no forensics, no echo of the
// image. We err toward caution — a false stop is acceptable; a false pass is not.
//
// Privacy: this function logs nothing about the content. The image bytes are
// used for one classification call and then discarded by the caller.

export type SafetyResult = "clear" | "flagged" | "error";

const SAFETY_SYSTEM = [
  "You are a strict content-safety classifier for a child-safety tool.",
  "You will see one image. Do NOT describe it. Do NOT analyze it for anything else.",
  "Decide one thing only: could this image show a real or realistic person who",
  "appears to be under 18 in a nude, partially nude, or sexual way? AI-made or",
  "edited images count too.",
  "Err toward caution. If you are unsure whether the person is under 18, OR",
  "unsure whether it is nude/sexual, set the flag to true.",
  "Reply only by calling the structured output.",
].join(" ");

const SCHEMA = {
  type: "object",
  properties: {
    possible_minor_intimate: {
      type: "boolean",
      description:
        "True if the image could show a person under 18 in a nude/sexual way.",
    },
  },
  required: ["possible_minor_intimate"],
  additionalProperties: false,
} as const;

export async function screenForSafety(
  buffer: Buffer,
  mime: string,
): Promise<SafetyResult> {
  try {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: SAFETY_MODEL,
      max_tokens: 64,
      system: SAFETY_SYSTEM,
      output_config: {
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: toImageMediaType(mime),
                data: buffer.toString("base64"),
              },
            },
            {
              type: "text",
              text: "Classify this image. Do not describe it.",
            },
          ],
        },
      ],
    });

    // A refusal is itself a strong signal to stop. Treat it as flagged.
    if (response.stop_reason === "refusal") return "flagged";

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return "error";

    const parsed = JSON.parse(text.text) as {
      possible_minor_intimate?: unknown;
    };
    // Anything other than an explicit false is treated as flagged (fail safe).
    return parsed.possible_minor_intimate === false ? "clear" : "flagged";
  } catch {
    // Could not run the check — do not proceed to analysis.
    return "error";
  }
}
