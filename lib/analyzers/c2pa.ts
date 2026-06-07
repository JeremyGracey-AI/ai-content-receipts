import "server-only";
import type { ProvenanceFinding } from "@/lib/types";

// Reads Content Credentials (C2PA) from an image, server-side.
//
// The spec names the `c2pa` package; that is the browser SDK (WASM + worker),
// which does not run in a Node route handler. `c2pa-node` is the Node binding
// from the same Content Authenticity project and is the correct server choice.
// It is an OPTIONAL dependency: if the native binding is missing, we degrade to
// "no receipt found" (readerUnavailable) rather than crash — and absence is
// never treated as proof of anything (spec §2, §5.4).

const EMPTY: ProvenanceFinding = {
  present: false,
  valid: null,
  claimGenerator: null,
  aiSignals: [],
  actions: [],
  readerUnavailable: false,
};

// IPTC DigitalSourceType tokens that indicate AI involvement, mapped to plain
// language. We match on the token substring so the full IPTC URL also matches.
const AI_SOURCE_SIGNALS: Array<{ token: string; plain: string }> = [
  {
    token: "trainedAlgorithmicMedia",
    plain: "The receipt says this was made by AI.",
  },
  {
    token: "compositeWithTrainedAlgorithmicMedia",
    plain: "The receipt says AI was used to change part of this.",
  },
  {
    token: "algorithmicMedia",
    plain: "The receipt says this was made by a computer program.",
  },
];

const ACTION_PLAIN: Record<string, string> = {
  "c2pa.created": "The receipt says the picture was created.",
  "c2pa.edited": "The receipt says the picture was edited.",
  "c2pa.placed": "The receipt says something was added to it.",
  "c2pa.cropped": "The receipt says it was cropped.",
  "c2pa.color_adjustments": "The receipt says its colors were changed.",
  "c2pa.drawing": "The receipt says someone drew on it.",
  "c2pa.filtered": "The receipt says a filter was used.",
};

async function loadC2pa(): Promise<unknown | null> {
  try {
    // Variable specifier keeps this decoupled from the bundler and the type
    // checker — the package may not be installed on every platform.
    const specifier = "c2pa-node";
    return (await import(specifier)) as unknown;
  } catch {
    return null;
  }
}

export async function readContentCredentials(
  buffer: Buffer,
  mimeType: string,
): Promise<ProvenanceFinding> {
  const mod = (await loadC2pa()) as
    | { createC2pa?: () => { read: (asset: unknown) => Promise<unknown> } }
    | null;

  if (!mod || typeof mod.createC2pa !== "function") {
    return { ...EMPTY, readerUnavailable: true };
  }

  try {
    const c2pa = mod.createC2pa();
    const store = (await c2pa.read({ buffer, mimeType })) as ManifestStore | null;
    if (!store) return { ...EMPTY };

    const active = store.active_manifest ?? null;
    if (!active) return { ...EMPTY };

    const finding: ProvenanceFinding = {
      present: true,
      valid: isValid(store),
      claimGenerator: cleanGenerator(active.claim_generator),
      aiSignals: [],
      actions: [],
      readerUnavailable: false,
    };

    const assertions = Array.isArray(active.assertions) ? active.assertions : [];
    const haystack = JSON.stringify(assertions);

    for (const sig of AI_SOURCE_SIGNALS) {
      if (haystack.includes(sig.token) && !finding.aiSignals.includes(sig.plain)) {
        finding.aiSignals.push(sig.plain);
      }
    }

    for (const assertion of assertions) {
      const label = String(assertion?.label ?? "");
      if (!label.includes("actions")) continue;
      const actionList = extractActions(assertion?.data);
      for (const action of actionList) {
        const plain = ACTION_PLAIN[action];
        if (plain && !finding.actions.includes(plain)) finding.actions.push(plain);
      }
    }

    return finding;
  } catch {
    // A read error is not a broken seal; treat it as "could not read a receipt".
    return { ...EMPTY, readerUnavailable: true };
  }
}

// --- internal shapes (loose; the binding's types vary by version) -----------

type ManifestStore = {
  active_manifest?: Manifest | null;
  validation_status?: Array<{ code?: string }> | null;
};

type Manifest = {
  claim_generator?: string | null;
  assertions?: Array<{ label?: string; data?: unknown }> | null;
};

function isValid(store: ManifestStore): boolean {
  const status = store.validation_status;
  if (!status || status.length === 0) return true;
  // If any status code looks like an error, the seal did not check out.
  return !status.some((s) => String(s?.code ?? "").toLowerCase().includes("error"));
}

function cleanGenerator(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Generator strings look like "Adobe Firefly 1.0 (..." — keep the readable head.
  const head = raw.split("(")[0]?.trim();
  return head && head.length > 0 ? head : null;
}

function extractActions(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const actions = (data as { actions?: Array<{ action?: string }> }).actions;
  if (!Array.isArray(actions)) return [];
  return actions
    .map((a) => (typeof a?.action === "string" ? a.action : null))
    .filter((a): a is string => Boolean(a));
}
