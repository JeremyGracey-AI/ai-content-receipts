"use client";

import { HELP_SCREEN } from "@/lib/copy/templates";

// Shown when the safety gate flags possible intimate content involving a minor.
// We never analyze or describe the file; we route to help (spec §6).
export function HelpScreen() {
  return (
    <section className="stop" role="alert" aria-label="We stopped to get help">
      <h2>{HELP_SCREEN.title}</h2>
      {HELP_SCREEN.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <div>
        {HELP_SCREEN.resources.map((r, i) => (
          <div className="resource" key={i}>
            <span className="name">{r.name}</span>
            <p style={{ margin: "2px 0" }}>{r.detail}</p>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.url}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
