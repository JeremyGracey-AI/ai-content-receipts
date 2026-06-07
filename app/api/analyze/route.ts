import { NextResponse } from "next/server";
import { isAcceptedImageType, MAX_UPLOAD_BYTES } from "@/lib/config";
import { screenForSafety } from "@/lib/safety";
import { analyzeImage } from "@/lib/modalities/image";
import {
  buildAccountResult,
  buildAudioResult,
  buildVideoResult,
} from "@/lib/modalities/checklists";
import type { AnalyzeResponse } from "@/lib/types";

// Node runtime: we need Buffer, exifr, and the c2pa native binding.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// PRIVACY: uploads are processed in memory and never written to disk or logged.
// We never log the image bytes, the safety result, or any analysis output.

export async function POST(req: Request): Promise<NextResponse<AnalyzeResponse>> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, stop: "error", message: "We could not read your upload." },
      { status: 400 },
    );
  }

  const modality = String(form.get("modality") || "");

  // The three coached modalities never take an image upload here, so they skip
  // the safety gate. They return a static, honest checklist (spec §3).
  if (modality === "account") {
    return NextResponse.json({ ok: true, result: buildAccountResult() });
  }
  if (modality === "video") {
    return NextResponse.json({ ok: true, result: buildVideoResult() });
  }
  if (modality === "audio") {
    return NextResponse.json({ ok: true, result: buildAudioResult() });
  }
  if (modality !== "image") {
    return NextResponse.json(
      { ok: false, stop: "error", message: "Unknown thing to check." },
      { status: 400 },
    );
  }

  // --- image path ----------------------------------------------------------
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, stop: "error", message: "Please choose an image first." },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, stop: "error", message: "That image is too big." },
      { status: 413 },
    );
  }
  if (!isAcceptedImageType(file.type)) {
    return NextResponse.json(
      { ok: false, stop: "error", message: "That image type is not supported." },
      { status: 415 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json(
      { ok: false, stop: "error", message: "We could not read that image." },
      { status: 400 },
    );
  }

  // SAFETY GATE — runs first, before any analysis (spec §6). Err toward caution.
  const safety = await screenForSafety(buffer, file.type);
  if (safety === "flagged") {
    return NextResponse.json({
      ok: false,
      stop: "safety",
      message: "We stopped to keep someone safe.",
    });
  }
  if (safety === "error") {
    return NextResponse.json({
      ok: false,
      stop: "error",
      message: "We could not safety-check this right now.",
    });
  }

  // Clear — run the real analysis.
  try {
    const result = await analyzeImage(buffer, file.type);
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({
      ok: false,
      stop: "error",
      message: "Something went wrong while reading the image.",
    });
  }
}
