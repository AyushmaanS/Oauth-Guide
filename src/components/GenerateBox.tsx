"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { readSse } from "@/lib/sse";
import { ProgressPanel, emptyProgress, type ProgressState } from "./ProgressPanel";
import { Icon } from "./ui";

type Ev = { stage?: string; label?: string; n?: number; action?: "search" | "read"; target?: string; reason?: string; title?: string; url?: string; items?: ProgressState["checklist"]; message?: string; slug?: string };

export function GenerateBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery.slice(0, 120));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressState>(emptyProgress());
  const ac = useRef<AbortController | null>(null);

  /** The server keeps working and saves the guide even if this page's stream drops, so look for it before giving up. */
  async function recover(signal: AbortSignal): Promise<string | null> {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 6000));
      if (signal.aborted) return null;
      try {
        const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, lookup: true }), signal });
        if (r.ok) return ((await r.json()) as { slug: string }).slug;
      } catch {
        /* keep trying */
      }
    }
    return null;
  }

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
      throw new Error("stream ended early");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setProgress((p) => ({ ...p, warnings: [...p.warnings, "Reconnecting. The guide is still being built, and it will open here when it is ready."] }));
      const slug = await recover(ac.current!.signal);
      if (slug) router.push(`/guide/${slug}`);
      else setError("The connection dropped and the guide did not finish. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const examples = ["Zoom", "Notion", "Shopify", "Dropbox", "HubSpot"];
  return (
    <form id="generate" className="scroll-mt-24" onSubmit={(e) => { e.preventDefault(); if (query.trim() && !busy) run(false); }}>
      <label htmlFor="gen" className="sr-only">Generate a guide for any app (name or website)</label>
      <div className="card flex items-center gap-2 !rounded-full p-1.5 pl-5 focus-within:border-[var(--accent)]">
        <Icon name="search" className="h-5 w-5 text-muted" />
        <input id="gen" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={120} disabled={busy} placeholder="Any app or website, e.g. Zoom" autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-muted focus-visible:outline-none" />
        <button type="submit" disabled={busy || !query.trim()} className="btn btn-primary shrink-0 !px-4 !py-2.5 !text-base sm:!px-5">
          {busy ? <><Icon name="loader" spin /> Working…</> : <>Generate <Icon name="arrow" /></>}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Try</span>
        {examples.map((x) => (
          <button key={x} type="button" disabled={busy} onClick={() => setQuery(x)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2 hover:border-ink disabled:opacity-50">{x}</button>
        ))}
        <span className="basis-full pt-1 text-xs">Takes up to about two minutes. Live guides are researched faster and with lighter evidence than library guides.</span>
      </div>
      {error && (
        <div role="alert" className="tone-hard tint mt-4 flex items-start gap-3 rounded-xl border p-3.5 text-sm text-ink">
          <Icon name="alert" className="mt-0.5 h-4 w-4 text-[var(--hard)]" />
          <span>{error} {!busy && query.trim() && <button type="button" className="ml-2 font-semibold underline underline-offset-4" onClick={() => run(false)}>Retry</button>}</span>
        </div>
      )}
      {(busy || progress.stages.length > 0) && <ProgressPanel p={progress} subject={query.trim() || undefined} />}
    </form>
  );
}
