// Shared types for Receipts.
//
// Every modality returns the same shaped `Result` so the three-block UI is
// identical everywhere and a teacher can teach the shape once. See spec §4.

export type Modality = "image" | "video" | "audio" | "account";

export type ReceiptStatus = "yes" | "no" | "unsure";

export type Result = {
  modality: Modality;
  /** Block 1: does it carry proof of where it came from? One plain sentence. */
  receipt: { status: ReceiptStatus; plain: string };
  /** Block 2: what looks off. Findings for images; checklist items otherwise. */
  signs: { items: string[]; plain: string };
  /** Block 3: the habit to build — the next thing to actually do. */
  nextSteps: string[];
  /**
   * If false, the UI must show the "no receipt is not proof" line.
   * "Provenance" here means a real, signed Content Credential — not EXIF.
   */
  hasProvenance: boolean;
};

/** What the server tells the client. Either a result, or a reason we stopped. */
export type AnalyzeResponse =
  | { ok: true; result: Result }
  | { ok: false; stop: "safety" | "error"; message: string };

/** Raw, structured findings from the image analyzers, before plain-language. */
export type ImageFindings = {
  provenance: ProvenanceFinding;
  exif: ExifFinding | null;
  watermark: WatermarkFinding;
};

export type ProvenanceFinding = {
  /** Did we find a Content Credential (C2PA manifest) at all? */
  present: boolean;
  /** If present, did its cryptographic seal check out? */
  valid: boolean | null;
  /** The tool that made or last edited the file, if the manifest names one. */
  claimGenerator: string | null;
  /** Plain hints that AI was involved, drawn from digitalSourceType assertions. */
  aiSignals: string[];
  /** Short, human-readable edit/action history. */
  actions: string[];
  /** Set when the reader could not run at all (treated as "no receipt found"). */
  readerUnavailable: boolean;
};

export type ExifFinding = {
  cameraMake: string | null;
  cameraModel: string | null;
  takenAt: string | null;
  software: string | null;
};

export type WatermarkFinding = {
  /** We always check; we just rarely can detect. Honesty over false verdicts. */
  checked: boolean;
  found: boolean;
};

/** The plain-language blocks the explanation layer (or a template) produces. */
export type ExplanationBlocks = {
  receiptPlain: string;
  signsItems: string[];
  signsPlain: string;
  nextSteps: string[];
};
