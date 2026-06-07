import { describe, it, expect } from "vitest";
import { MAX_FK_GRADE } from "@/lib/config";
import { gradeCopy, gradeText } from "@/lib/readability";
import {
  NO_RECEIPT_LINE,
  HELP_SCREEN,
  ERROR_STOP,
  GROWNUP_NOTES,
  VOICE,
  imageFallback,
} from "@/lib/copy/templates";
import {
  buildAccountResult,
  buildAudioResult,
  buildVideoResult,
} from "@/lib/modalities/checklists";
import { containsForbidden } from "@/lib/forbidden";
import type { ImageFindings, Result } from "@/lib/types";

function gradeResult(r: Result): number {
  return gradeCopy({
    sentences: [r.receipt.plain, r.signs.plain, ...r.nextSteps],
    itemGroups: [r.signs.items],
  });
}

function gradeBlocks(b: {
  receiptPlain: string;
  signsPlain: string;
  signsItems: string[];
  nextSteps: string[];
}): number {
  return gradeCopy({
    sentences: [b.receiptPlain, b.signsPlain, ...b.nextSteps],
    itemGroups: [b.signsItems],
  });
}

// Three representative finding shapes that drive the image fallback copy.
const NO_MANIFEST: ImageFindings = {
  provenance: {
    present: false,
    valid: null,
    claimGenerator: null,
    aiSignals: [],
    actions: [],
    readerUnavailable: false,
  },
  exif: null,
  watermark: { checked: true, found: false },
};

const VALID_AI: ImageFindings = {
  provenance: {
    present: true,
    valid: true,
    claimGenerator: "Adobe Firefly",
    aiSignals: ["The receipt says this was made by AI."],
    actions: ["The receipt says the picture was created."],
    readerUnavailable: false,
  },
  exif: {
    cameraMake: "Apple",
    cameraModel: "iPhone 13",
    takenAt: "2024-01-01",
    software: "iOS 17",
  },
  watermark: { checked: true, found: false },
};

const BROKEN_SEAL: ImageFindings = {
  provenance: {
    present: true,
    valid: false,
    claimGenerator: "Some Editor",
    aiSignals: [],
    actions: ["The receipt says the picture was edited."],
    readerUnavailable: false,
  },
  exif: null,
  watermark: { checked: true, found: false },
};

describe("shipped copy reads at 8th grade or lower (spec §5.8)", () => {
  it("the required no-receipt line passes the gate", () => {
    expect(gradeText(NO_RECEIPT_LINE)).toBeLessThanOrEqual(MAX_FK_GRADE);
  });

  it("image fallback copy passes for every receipt status", () => {
    for (const findings of [NO_MANIFEST, VALID_AI, BROKEN_SEAL]) {
      expect(gradeBlocks(imageFallback(findings))).toBeLessThanOrEqual(
        MAX_FK_GRADE,
      );
    }
  });

  it("the safety Help screen passes", () => {
    const grade = gradeCopy({
      sentences: [
        HELP_SCREEN.title,
        ...HELP_SCREEN.body,
        ...HELP_SCREEN.resources.map((r) => r.detail),
      ],
    });
    expect(grade).toBeLessThanOrEqual(MAX_FK_GRADE);
  });

  it("the error-stop screen passes", () => {
    const grade = gradeCopy({ sentences: [ERROR_STOP.title, ...ERROR_STOP.body] });
    expect(grade).toBeLessThanOrEqual(MAX_FK_GRADE);
  });

  it("the grown-up notes pass", () => {
    const grade = gradeCopy({
      sentences: [GROWNUP_NOTES.title, ...GROWNUP_NOTES.body],
    });
    expect(grade).toBeLessThanOrEqual(MAX_FK_GRADE);
  });

  it("the voice command copy passes", () => {
    const grade = gradeCopy({ sentences: Object.values(VOICE) });
    expect(grade).toBeLessThanOrEqual(MAX_FK_GRADE);
  });

  it("the account, video, and audio checklists pass", () => {
    expect(gradeResult(buildAccountResult())).toBeLessThanOrEqual(MAX_FK_GRADE);
    expect(gradeResult(buildVideoResult())).toBeLessThanOrEqual(MAX_FK_GRADE);
    expect(gradeResult(buildAudioResult())).toBeLessThanOrEqual(MAX_FK_GRADE);
  });
});

describe("forbidden-phrase guard (spec §1.1)", () => {
  it("flags certainty and percentages", () => {
    expect(containsForbidden("This photo is real.")).toBe(true);
    expect(containsForbidden("It is fake.")).toBe(true);
    expect(containsForbidden("This is 87% AI.")).toBe(true);
    expect(containsForbidden("This is definitely a fake.")).toBe(true);
  });

  it("allows the required hedged 'real or fake' idea", () => {
    expect(containsForbidden(NO_RECEIPT_LINE)).toBe(false);
    expect(
      containsForbidden("We cannot tell if it is real or fake."),
    ).toBe(false);
    expect(
      containsForbidden("A no receipt does not mean it is real or fake."),
    ).toBe(false);
  });

  it("does not flag the image fallback copy it backs up", () => {
    for (const findings of [NO_MANIFEST, VALID_AI, BROKEN_SEAL]) {
      const b = imageFallback(findings);
      const all = [b.receiptPlain, b.signsPlain, ...b.signsItems, ...b.nextSteps].join(" ");
      expect(containsForbidden(all)).toBe(false);
    }
  });
});
