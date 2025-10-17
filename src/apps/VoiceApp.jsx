import React from "react";
import { AppShell } from "./AppShell.jsx";

export function VoiceApp() {
  return (
    <AppShell title="Voice" subtitle="Record & transcribe" actions={<button className="px-3 py-1 border">Record</button>}>
      <div className="text-slate-600 text-sm">Input, waveform, and transcription list will go here.</div>
    </AppShell>
  );
}