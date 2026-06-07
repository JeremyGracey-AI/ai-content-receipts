import type { ExplanationBlocks, ImageFindings } from "@/lib/types";

// All copy here is written for an 8th-grade reading level and is gated by
// test/copy.test.ts (Flesch-Kincaid <= 8). Edit with that test in mind.

/**
 * The exact idea required by spec §2, rule 2. Shown whenever a result lacks
 * provenance. Absence of a receipt is never treated as evidence.
 */
export const NO_RECEIPT_LINE =
  "This file has no receipt. That's normal, and it does not mean it's real or fake.";

/** Short, shared habits that close every result (spec §4, block 3). */
export const CORE_NEXT_STEPS = {
  reverseSearch: "Do a reverse image search to see where else it shows up.",
  checkAccount: "Check who posted it. Is the account new, odd, or copying someone?",
  callBack: "If it matters, ask the person using a number you already know.",
  getHelp: "If it makes you feel unsafe, tell a trusted adult.",
};

/**
 * The safety-net copy for the image path. Used when the explanation layer fails
 * or its output is too hard to read (spec §5.7). Deterministic and plain.
 */
export function imageFallback(findings: ImageFindings): ExplanationBlocks {
  const { provenance, exif, watermark } = findings;

  let receiptPlain: string;
  if (provenance.present && provenance.valid === true) {
    receiptPlain =
      "This picture has a receipt, and its seal checks out. We can trust where it says it came from.";
  } else if (provenance.present && provenance.valid === false) {
    receiptPlain =
      "This picture has a receipt, but its seal is broken or the signer is unknown. So we cannot trust it.";
  } else {
    receiptPlain =
      "This picture has no receipt. That is normal. It does not tell us if it is real or fake.";
  }

  const items: string[] = [];
  for (const signal of provenance.aiSignals) items.push(signal);
  if (provenance.claimGenerator) {
    items.push(`The receipt says the tool used was ${provenance.claimGenerator}.`);
  }
  for (const action of provenance.actions.slice(0, 3)) items.push(action);
  if (exif?.software) {
    items.push(`The hidden photo info names this software: ${exif.software}.`);
  }
  if (watermark.checked && !watermark.found) {
    items.push("We looked for a hidden watermark and did not find one.");
  }

  let signsPlain: string;
  if (provenance.aiSignals.length > 0) {
    signsPlain =
      "The receipt itself says a computer helped make or change this picture.";
  } else if (items.length > 0) {
    signsPlain = "Here is what we found. None of it alone proves anything.";
  } else {
    signsPlain = "We did not see clear signs either way.";
  }

  const nextSteps = [
    CORE_NEXT_STEPS.reverseSearch,
    CORE_NEXT_STEPS.checkAccount,
    CORE_NEXT_STEPS.callBack,
  ];

  return { receiptPlain, signsItems: items, signsPlain, nextSteps };
}

/**
 * The Help screen shown when the safety gate flags possible intimate content
 * involving a minor (spec §6, §7). We never analyze or describe the file.
 *
 * NOTE (build-time): confirm these URLs and phone numbers are current before
 * each release. Source list per the safety-protocol doc.
 */
export const HELP_SCREEN = {
  title: "Let's stop and get help.",
  body: [
    "We did not look at this file. We stopped on purpose.",
    "If a photo shows a real person under 18 with no clothes, it can hurt them. That is true even if a computer made it.",
    "You are not in trouble for asking. The brave thing is to tell a trusted adult right now. That could be a parent, a school counselor, or a teacher.",
    "You can also get a photo taken down. The free help below is a good place to start.",
  ],
  resources: [
    {
      name: "Take It Down",
      detail: "It can help remove nude photos of people under 18.",
      url: "https://takeitdown.ncmec.org/",
    },
    {
      name: "NCMEC CyberTipline",
      detail: "You can report it here, or call 1-800-843-5678.",
      url: "https://report.cybertip.org/",
    },
    {
      name: "988 Lifeline",
      detail: "If you feel unsafe, call or text 988 to talk to someone.",
      url: "https://988lifeline.org/",
    },
  ],
};

/** Shown when the safety check itself could not run. We still do not analyze. */
export const ERROR_STOP = {
  title: "We could not check this right now.",
  body: [
    "Our safety check did not run. So we did not look at your file.",
    "This is not about you. Please try again in a little while.",
    "If a photo ever makes you feel worried, talk to a trusted adult.",
  ],
};

/**
 * Grown-up notes (spec §7). Adult-facing guidance, off by default, so the
 * teen-facing page stays clean. Drawn from the teacher and parent guides.
 */
export const GROWNUP_NOTES = {
  title: "For grown-ups",
  body: [
    "This tool builds habits, not quick answers. The goal is to help a young person learn to ask good questions.",
    "Try it together. Ask them what they notice and why. Let them lead.",
    "Keep it calm. There is no score and no trick. A wrong guess is a chance to learn.",
    "Want a short lesson? Pick one photo. Walk through the three blocks. Ask: what is the receipt, what looks off, and what would you do next? Thirty minutes is plenty.",
    "If something here worries you or them, stop and talk. You can also reach out to the school.",
  ],
};

/**
 * Voice "magic words" copy. Kept short and plain (gated FK <= 8). The mic is
 * press-to-talk and audio never leaves the device.
 */
export const VOICE = {
  buttonIdle: "Use your voice",
  buttonListening: "Listening…",
  hint: "Tap the mic, then say: “Mirror, mirror, in my hand, show me the receipts for this.”",
  listening: "Listening… say the magic words.",
  heard: "Got it. Reading now.",
  notSupported: "Your browser cannot listen yet. Use the buttons instead.",
  needImage: "Pick a photo first, then say it again.",
  micDenied: "We need mic access to listen. You can still use the buttons.",
};
