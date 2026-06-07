"use client";

import { ACCEPTED_IMAGE_TYPES } from "@/lib/config";

export function Uploader({
  file,
  onPick,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  return (
    <div>
      <label htmlFor="image-input">Choose a photo to check</label>
      <input
        id="image-input"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <p className="muted" style={{ marginTop: 8 }}>
          Picked: {file.name}
        </p>
      ) : null}
      <p className="muted" style={{ marginTop: 8 }}>
        Your photo is checked and then thrown away. We do not save it.
      </p>
    </div>
  );
}
