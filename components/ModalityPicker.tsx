"use client";

import type { Modality } from "@/lib/types";

const OPTIONS: Array<{ id: Modality; name: string; desc: string }> = [
  { id: "image", name: "Photo", desc: "Upload a photo. We read its receipt and look for signs." },
  { id: "account", name: "Account or post", desc: "Check a profile with a quick checklist." },
  { id: "video", name: "Video", desc: "Use a guided checklist to spot fakes." },
  { id: "audio", name: "Voice or audio", desc: "Learn the call-back habit for fake voices." },
];

export function ModalityPicker({
  value,
  onChange,
}: {
  value: Modality;
  onChange: (m: Modality) => void;
}) {
  return (
    <div
      className="picker"
      role="group"
      aria-label="What do you want to check?"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          <span className="name">{opt.name}</span>
          <span className="desc">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}
