import type { Result } from "@/lib/types";

// Guided checklists for the modalities that have no reliable automated detector
// (spec §3). These are pure, static results: the app coaches, the user decides.
// We never fake a verdict here. Each receipt.plain carries the "no receipt is
// normal, and it does not mean real or fake" idea in plain words (spec §2).

export function buildAccountResult(): Result {
  return {
    modality: "account",
    receipt: {
      status: "unsure",
      plain: "An account is not a file. So there is no receipt to check here.",
    },
    signs: {
      items: [
        "Look at the account age. A brand-new account can be a red flag.",
        "Check the followers. Lots of followers but few posts looks odd.",
        "Read the bio. Does the name match the photo and the posts?",
        "Watch how it posts. Bots often post very fast or all day long.",
      ],
      plain: "These are clues, not proof. Look for a few of them together.",
    },
    nextSteps: [
      "Save the profile photo, then search it at https://lens.google.com to see where else it shows up.",
      "Check how old the account is and what it posted before.",
      "If it claims to be someone you know, reach them on an app you already use.",
    ],
    hasProvenance: false,
  };
}

export function buildVideoResult(): Result {
  return {
    modality: "video",
    receipt: {
      status: "no",
      plain:
        "Most videos have no receipt, and that is normal. It does not mean a video is real or fake.",
    },
    signs: {
      items: [
        "Watch the mouth. Do the lips match the words?",
        "Watch the eyes. Real people blink in a normal way.",
        "Look at the edges of the face and hair for blur or warping.",
        "Check the light. Do shadows fall the same way on the face and the room?",
      ],
      plain: "No single clue is proof. Slow the video down and look for a few together.",
    },
    nextSteps: [
      "Play it at slow speed and watch it more than once.",
      "Look for the same clip from a source you trust.",
      "If it claims someone said this, check their real page first.",
    ],
    hasProvenance: false,
  };
}

export function buildAudioResult(): Result {
  return {
    modality: "audio",
    receipt: {
      status: "no",
      plain:
        "Most voice clips have no receipt, and that is normal. It does not mean a clip is real or fake.",
    },
    signs: {
      items: [
        "A voice can be copied from just a few seconds of sound.",
        "Listen for odd pauses, a flat tone, or strange breaths.",
        "Be careful when a call rushes you and asks for money or codes.",
      ],
      plain: "A scary, urgent call is the biggest red flag. Slow down.",
    },
    nextSteps: [
      "Hang up. Call the person back on a number you already know.",
      "Pick a family safe word to ask for in a real emergency.",
      "Never send money or codes just because a voice told you to hurry.",
    ],
    hasProvenance: false,
  };
}
