import { describe, it, expect } from "vitest";
import { isWakePhrase, normalizeTranscript } from "@/lib/voice";

describe("voice wake-phrase matching", () => {
  it("normalizes punctuation and case", () => {
    expect(normalizeTranscript("Mirror, MIRROR!  Show me.")).toBe(
      "mirror mirror show me",
    );
  });

  it("matches the full incantation", () => {
    expect(
      isWakePhrase(
        "Mirror mirror in my hand, show me the receipts for this content",
      ),
    ).toBe(true);
  });

  it("matches a plainer 'show me the receipts' ask", () => {
    expect(isWakePhrase("show me the receipts for this image")).toBe(true);
    expect(isWakePhrase("mirror mirror, show me the receipt")).toBe(true);
  });

  it("does not trigger on unrelated speech", () => {
    expect(isWakePhrase("what is the weather today")).toBe(false);
    expect(isWakePhrase("mirror on the wall")).toBe(false); // no "receipt"
    expect(isWakePhrase("show me the cat")).toBe(false); // no "receipt"
    expect(isWakePhrase("")).toBe(false);
  });
});
