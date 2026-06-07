# Receipts

> An AI‑content **literacy** tool — not a forensic detector. Teachers, parents, and
> teens use it to *learn how to judge media* at an 8th‑grade reading level. It
> teaches reasoning and verification habits; it never hands down a confident
> "real / fake" verdict.
>
> The name comes from the core metaphor: a photo's provenance is a **receipt** of
> where it came from. It's a placeholder — rename freely.

## What this milestone ships

This is **M1 (the image analyzer) plus the Safety guardrail**, built together as
the spec requires, with the shared result UI and the coached modalities in place.

| Area | Status |
|---|---|
| **M1 — Image analyzer** | ✅ Content Credentials (C2PA) + EXIF + honest watermark check → explanation layer → readability gate → three‑block result |
| **Safety guardrail (§6)** | ✅ Runs first, before any analysis; fails **closed**; routes to a Help screen; logs nothing |
| **Three‑block result UI (§4)** | ✅ Identical shape across every modality |
| **Grown‑up notes (§7)** | ✅ Off‑by‑default toggle |
| **Readability gate (§5.7) + test (§5.8)** | ✅ Flesch‑Kincaid ≤ 8, enforced in code and in CI tests |
| **Accounts / Video / Audio** | ✅ **Honest guided checklists** (no faked detection). Real automated detection for these is later work (M2–M4). |

The other modalities are coaches, not detectors — exactly as §3 mandates. They
return the same `Result` shape through the same UI so the "shape" is learnable.

## The non‑negotiable rules, and where they live in code

1. **No false certainty.** No "this is real", no numeric AI percentage. Enforced
   by `lib/forbidden.ts` (a guard the explanation layer runs on every model
   output) and tested in `test/copy.test.ts`.
2. **Absence is not proof.** When an image has no manifest the UI shows the exact
   line: *"This file has no receipt. That's normal, and it does not mean it's
   real or fake."* (`lib/copy/templates.ts` → `NO_RECEIPT_LINE`).
3. **8th‑grade reading level, gated.** Every generated explanation passes a
   Flesch‑Kincaid ≤ 8 check with a re‑simplify loop and a plain fallback
   (`lib/explain.ts`, `lib/readability.ts`). All shipped static copy is gated by
   `test/copy.test.ts`.
4. **Explain, don't judge.** Each result answers "why?" in one or two sentences.
5. **Honest per modality.** Only images get real automated analysis (§3).
6. **Safety ships before launch.** The gate is in the request path now, not a
   fast‑follow.

## Architecture

Single Next.js (App Router) app. All analysis and model calls run **server‑side**
in the route handler — no API keys in the client.

```
Upload / intake (POST /api/analyze)
      │
      ▼
Safety gate ──(flagged)──► Stop + Help screen      [runs FIRST, before analysis]
      │ (clear)            (error)──► calm "try again" stop
      ▼
Modality router ──► image | video | audio | account
      │
      ▼
Analyzer (real for image; checklist for others) → structured findings
      │
      ▼
Explanation layer (Claude Sonnet) → 8th‑grade text in the 3‑block shape
      │
      ▼
Readability gate (FK ≤ 8; re‑simplify loop; template fallback)
      │
      ▼
Three‑block result UI
```

### Key files

```
app/
  page.tsx                 # client UI: pick modality, submit, render result/stop
  api/analyze/route.ts     # safety gate first, then modality routing (Node runtime)
lib/
  safety.ts                # the content-safety gate (fail-closed, logs nothing)
  modalities/image.ts      # the real image pipeline
  modalities/checklists.ts # account / video / audio guided checklists
  analyzers/c2pa.ts        # Content Credentials read (optional native binding)
  analyzers/exif.ts        # EXIF as weak, easily-faked context only
  analyzers/watermark.ts   # honest "checked, not found" — never a verdict
  explain.ts               # explanation layer + readability loop + rule guard
  readability.ts           # Flesch-Kincaid gate (shared by code and tests)
  forbidden.ts             # blocks "is real" / percentages / false certainty
  copy/templates.ts        # vetted plain-language copy (no-receipt line, Help, etc.)
components/                # ModalityPicker, Uploader, ResultView, HelpScreen, GrownUpNotes
test/                      # readability + "all shipped copy is FK ≤ 8" + guard tests
```

## Models

The explanation layer and the safety classifier call Claude **server‑side** via
`@anthropic-ai/sdk`. The explanation layer uses the **current Claude Sonnet
model** by design (spec §5.6) — fast, plain rewriting. Both are configurable:

| Setting | Default | Env override |
|---|---|---|
| Explanation model | `claude-sonnet-4-6` | `RECEIPTS_EXPLANATION_MODEL` |
| Safety model | `claude-sonnet-4-6` | `RECEIPTS_SAFETY_MODEL` |

Structured outputs (`output_config.format`) are used so the model returns
parseable, schema‑valid blocks — no prefills.

## A note on the C2PA library

The spec names the `c2pa` npm package; that is the **browser** SDK (WASM +
worker) and does not run inside a Node route handler. This app uses
[`c2pa-node`](https://github.com/contentauth/c2pa-node) — the Node binding from
the same Content Authenticity project — which is the correct server‑side choice.

It is an **optional dependency**: it ships a native (N‑API) binding, so if it
fails to install or load on a platform, `lib/analyzers/c2pa.ts` degrades to "no
receipt found" rather than crashing. Per the rules, absence is **never** treated
as proof of anything. It's kept out of the bundler via `serverExternalPackages`
in `next.config.mjs`.

## Image formats

Uploads may be JPEG, PNG, WebP, AVIF, TIFF, or HEIC (the iPhone default). The
safety gate sends images to Claude vision, which accepts JPEG/PNG/WebP/GIF, so
`lib/vision.ts` transcodes AVIF/TIFF to JPEG with `sharp` and HEIC with
`heic-convert` before the call. Transcoding happens in memory only; if a file
cannot be decoded, the app **fails closed** (it stops rather than analyze).

## Privacy

- Uploads are processed **in memory** and never written to disk.
- We never log image bytes, the safety result, or analysis output.
- The safety gate runs **first** and **fails closed**: if it cannot run (e.g. the
  API is unreachable), the app stops and does **not** analyze. A false stop is
  acceptable; a false pass is not.
- No third‑party trackers; no telemetry tied to minors. (Next.js's own anonymous
  build telemetry can be disabled with `npx next telemetry disable`.)

## Setup

Requires Node ≥ 20.11.

```bash
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Scripts:

```bash
npm run dev         # local dev server
npm run build       # production build
npm start           # run the production build
npm run typecheck   # tsc --noEmit
npm test            # vitest: readability gate + "all copy is FK ≤ 8" + guard
```

### Environment variables

| Name | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes (server‑side only) | explanation layer + safety gate |
| `RECEIPTS_EXPLANATION_MODEL` | no | override the explanation model |
| `RECEIPTS_SAFETY_MODEL` | no | override the safety model |

The image path needs `ANTHROPIC_API_KEY`. The account/video/audio checklists do
**not** call any model and work without it.

## Deploying (Vercel)

- Set `ANTHROPIC_API_KEY` in the project's environment variables (server‑side).
- `c2pa-node` is native; `serverExternalPackages` already keeps it unbundled. If
  the binding is unavailable in your runtime, provenance reads degrade gracefully
  to "no receipt found" — wire up the binding to enable real Content Credentials
  reads.

## ⚠️ Before any public use

- **Verify the safety resources.** `HELP_SCREEN` in `lib/copy/templates.ts` lists
  removal/reporting resources (e.g. NCMEC *Take It Down*, the CyberTipline, the
  988 Lifeline). Confirm every URL and phone number is current at build time.
- The safety gate uses a model‑based classifier and errs toward caution. Review
  and tune it against your own threshold before exposing the app to an audience.

## Roadmap

| Milestone | Scope |
|---|---|
| **M1** (done) | Image analyzer: credentials + EXIF + explanation + readability gate + 3‑block UI |
| **Safety** (done) | The §6 guardrail: flagged uploads stop and route to help; nothing logged |
| **M2** | Accounts/posts: deeper heuristics + automated reverse‑image‑search |
| **M3** | Video: read credentials; richer checklist; real‑vs‑faked practice library |
| **M4** | Audio: watermark/credential read; fuller callback‑habit coaching |

## Repository MCP configuration

This repo also carries Hostinger API MCP server config for Claude Code
([`.mcp.json`](./.mcp.json)) and VS Code ([`.vscode/mcp.json`](./.vscode/mcp.json)).
The API token is referenced, never committed. See the config files for details;
set `HOSTINGER_API_TOKEN` in your environment to use it.
