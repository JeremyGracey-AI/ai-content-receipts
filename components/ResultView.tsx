"use client";

import { Fragment } from "react";
import type { ReceiptStatus, Result } from "@/lib/types";
import { NO_RECEIPT_LINE } from "@/lib/copy/templates";

const BADGE: Record<ReceiptStatus, string> = {
  yes: "Has a receipt",
  no: "No receipt",
  unsure: "Can't tell yet",
};

// Turn bare URLs in copy into real links so habits like reverse image search
// open correctly.
function withLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function ResultView({ result }: { result: Result }) {
  const showNoReceiptLine =
    result.modality === "image" && !result.hasProvenance;

  return (
    <section aria-label="What we found" className="result">
      {/* Block 1: The receipt */}
      <div className="card">
        <p className="block-label">The receipt</p>
        <span className={`badge ${result.receipt.status}`}>
          {BADGE[result.receipt.status]}
        </span>
        <p>{result.receipt.plain}</p>
        {showNoReceiptLine ? (
          <p className="no-receipt">{NO_RECEIPT_LINE}</p>
        ) : null}
      </div>

      {/* Block 2: The signs */}
      <div className="card">
        <p className="block-label">The signs</p>
        <p>{result.signs.plain}</p>
        {result.signs.items.length > 0 ? (
          <ul className="items">
            {result.signs.items.map((item, i) => (
              <li key={i}>{withLinks(item)}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Block 3: What to do next */}
      <div className="card">
        <p className="block-label">What to do next</p>
        <ol className="steps">
          {result.nextSteps.map((step, i) => (
            <li key={i}>{withLinks(step)}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
