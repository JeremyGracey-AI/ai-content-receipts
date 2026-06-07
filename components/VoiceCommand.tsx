"use client";

import { useEffect, useRef, useState } from "react";
import { isWakePhrase } from "@/lib/voice";
import { VOICE } from "@/lib/copy/templates";

// Voice "magic words" trigger. Speech recognition runs in the browser via the
// Web Speech API — no audio is uploaded or stored (privacy first). The mic is
// press-to-talk (a user gesture), never always-on. Voice is an enhancement: the
// buttons remain the primary, fully accessible path.

type Status = "idle" | "listening" | "heard" | "denied" | "unsupported";

function getRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceCommand({ onTrigger }: { onTrigger: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!getRecognitionCtor()) setStatus("unsupported");
    return () => {
      recRef.current?.abort();
      recRef.current = null;
    };
  }, []);

  function stop() {
    recRef.current?.stop();
  }

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscript(text.trim());
      if (isWakePhrase(text)) {
        setStatus("heard");
        stop();
        onTrigger();
      }
    };
    rec.onerror = (event) => {
      setStatus(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "denied"
          : "idle",
      );
    };
    rec.onend = () => {
      setStatus((s) => (s === "heard" ? "heard" : "idle"));
    };

    recRef.current = rec;
    setTranscript("");
    setStatus("listening");
    try {
      rec.start();
    } catch {
      // start() throws if called while already running; safe to ignore.
    }
  }

  function toggle() {
    if (status === "listening") {
      stop();
      setStatus("idle");
    } else {
      start();
    }
  }

  if (status === "unsupported") {
    return (
      <div className="voice">
        <p className="muted">{VOICE.notSupported}</p>
      </div>
    );
  }

  const listening = status === "listening";
  const liveMessage =
    status === "listening"
      ? VOICE.listening
      : status === "heard"
        ? VOICE.heard
        : status === "denied"
          ? VOICE.micDenied
          : "";

  return (
    <div className="voice">
      <button
        type="button"
        className="btn btn-secondary"
        aria-pressed={listening}
        onClick={toggle}
      >
        <span aria-hidden="true">🎙️</span>{" "}
        {listening ? VOICE.buttonListening : VOICE.buttonIdle}
      </button>
      <p className="muted" style={{ marginTop: 8 }}>
        {VOICE.hint}
      </p>
      <p className="muted" aria-live="polite">
        {liveMessage}
      </p>
      {transcript ? <p className="muted">&ldquo;{transcript}&rdquo;</p> : null}
    </div>
  );
}
