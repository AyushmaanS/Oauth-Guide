"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { readSse } from "@/lib/sse";
import { ProgressPanel, emptyProgress, type ProgressState } from "./ProgressPanel";

type Ev = { stage?: string; label?: string; n?: number; action?: "search" | "read"; target?: string; reason?: string; title?: string; url?: string; items?: ProgressState["checklist"]; message?: string; slug?: string };

export function GenerateBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery.slice(0, 120));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressState>(emptyProgress());
  const ac = useRef<AbortController | null>(null);

  async function run(force: boolean) {
    setBusy(true);
    setError("");
    setProgress(emptyProgress());
    ac.current = new AbortController();
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, force }), signal: ac.current.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status}).`);
        return;
      }
      for await (const { event, data } of readSse(res)) {
        const d = data as Ev;
        if (event === "stage_start") setProgress((p) => ({ ...p, stages: [...p.stages, { stage: d.stage!, label: d.label!, done: false }] }));
        else if (event === "stage_done") setProgress((p) => ({ ...p, stages: p.stages.map((s) => (s.stage === d.stage ? { ...s, done: true } : s)) }));
        else if (event === "agent_step") setProgress((p) => ({ ...p, steps: [...p.steps, { n: d.n!, action: d.action!, target: d.target!, reason: d.reason! }] }));
        else if (event === "source_found") setProgress((p) => ({ ...p, sources: [...p.sources, { title: d.title!, url: d.url! }] }));
        else if (event === "checklist") setProgress((p) => ({ ...p, checklist: d.items! }));
        else if (event === "warning") setProgress((p) => ({ ...p, warnings: [...p.warnings, d.message!] }));
        else if (event === "error") { setError(d.message ?? "Something went wrong."); return; }
        else if (event === "complete") { router.push(`/guide/${d.slug}`); return; }
      }
      setError("The connection ended before the guide finished. Please try again.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("The connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (query.trim() && !busy) run(false); }}>
      <label htmlFor="gen" className="block text-sm font-medium">Generate a guide for any app (name or website)</label>
      <div className="mt-1 flex gap-2">
        <input id="gen" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={120} disabled={busy} placeholder="e.g. Zoom, or zoom.us"
          className="w-full rounded border border-gray-500 px-3 py-2" />
        <button type="submit" disabled={busy || !query.trim()} className="rounded bg-gray-900 px-4 py-2 text-white disabled:bg-gray-400">{busy ? "Working…" : "Generate"}</button>
      </div>
      <p className="mt-1 text-xs text-gray-700">Takes up to about two minutes. Live guides are researched faster and with lighter evidence than library guides.</p>
      {error && (
        <div role="alert" className="mt-3 rounded border border-red-700 bg-red-50 p-3 text-sm text-red-950">
          {error} {!busy && query.trim() && <button type="button" className="ml-2 underline" onClick={() => run(false)}>Retry</button>}
        </div>
      )}
      {(busy || progress.stages.length > 0) && <ProgressPanel p={progress} />}
    </form>
  );
}
