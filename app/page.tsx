"use client";

import { useState } from "react";
import type { AnalyzeResponse, Modality } from "@/lib/types";
import { ModalityPicker } from "@/components/ModalityPicker";
import { Uploader } from "@/components/Uploader";
import { ResultView } from "@/components/ResultView";
import { HelpScreen } from "@/components/HelpScreen";
import { GrownUpNotes } from "@/components/GrownUpNotes";
import { VoiceCommand } from "@/components/VoiceCommand";
import { VOICE } from "@/lib/copy/templates";

export default function Home() {
  const [modality, setModality] = useState<Modality>("image");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);

  function changeModality(m: Modality) {
    setModality(m);
    setFile(null);
    setResponse(null);
    setVoiceMsg(null);
  }

  async function submit() {
    setPending(true);
    setResponse(null);
    setVoiceMsg(null);
    try {
      const fd = new FormData();
      fd.set("modality", modality);
      if (modality === "image" && file) fd.set("file", file);

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeResponse;
      setResponse(data);
    } catch {
      setResponse({
        ok: false,
        stop: "error",
        message: "We could not reach the server. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  // Voice "magic words" trigger. If the user asks for the receipts but an image
  // is needed and none is picked, we coach instead of analyzing nothing.
  function handleVoiceTrigger() {
    if (modality === "image" && !file) {
      setVoiceMsg(VOICE.needImage);
      return;
    }
    setVoiceMsg(null);
    void submit();
  }

  const canSubmit = modality !== "image" || file !== null;
  const submitLabel = modality === "image" ? "Check this photo" : "Show the checklist";

  return (
    <main id="main">
      <h1>Receipts</h1>
      <p className="lede">
        This tool helps you learn how to judge media. It will not tell you
        "real" or "fake." It helps you ask better questions.
      </p>

      <ModalityPicker value={modality} onChange={changeModality} />

      <div className="card">
        {modality === "image" ? (
          <Uploader file={file} onPick={setFile} />
        ) : (
          <p className="muted">
            {modality === "account"
              ? "We will show a checklist for spotting fake or copycat accounts."
              : modality === "video"
                ? "We will show a checklist for spotting fake videos."
                : "We will show how to handle a voice you are not sure about."}
          </p>
        )}

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn"
            onClick={submit}
            disabled={!canSubmit || pending}
          >
            {pending ? "Reading…" : submitLabel}
          </button>
        </div>

        <VoiceCommand onTrigger={handleVoiceTrigger} />
        {voiceMsg ? (
          <p className="muted" role="status" style={{ marginTop: 8 }}>
            {voiceMsg}
          </p>
        ) : null}
      </div>

      <div aria-live="polite">
        {pending ? <p className="muted">Reading… this can take a few seconds.</p> : null}

        {response && response.ok ? <ResultView result={response.result} /> : null}

        {response && !response.ok && response.stop === "safety" ? (
          <HelpScreen />
        ) : null}

        {response && !response.ok && response.stop === "error" ? (
          <div className="card" role="alert">
            <p>{response.message}</p>
            <p className="muted">
              If a photo ever worries you, talk to a trusted adult.
            </p>
          </div>
        ) : null}
      </div>

      <GrownUpNotes />
    </main>
  );
}
