"use client";

import { GROWNUP_NOTES } from "@/lib/copy/templates";

// A light toggle that adds adult-facing guidance. Off by default so the
// teen-facing page stays clean (spec §7).
export function GrownUpNotes() {
  return (
    <details className="grownup">
      <summary>{GROWNUP_NOTES.title}</summary>
      <div className="notes">
        {GROWNUP_NOTES.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}
