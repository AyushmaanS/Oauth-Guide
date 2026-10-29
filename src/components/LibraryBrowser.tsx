"use client";
import Link from "next/link";
import { useState } from "react";
import type { Difficulty, EvidenceLabel } from "@/lib/schema/guide";
import { DifficultyBadge } from "./badges";
import { AppTile, DIFF_ORDER, DIFF_TEXT, DifficultyScale, EVIDENCE_ORDER, EVIDENCE_TEXT, EvidenceBar, Icon, LevelLadder } from "./ui";

export interface LibraryItem {
  slug: string;
  appName: string;
  difficulty: Difficulty;
  confidence?: "established" | "estimated" | "unresolved";
  range?: { best: Difficulty; worst: Difficulty };
  summary: string;
  attemptLevel: string;
  isFixture: boolean;
  counts?: Record<EvidenceLabel, number>;
  steps?: number;
}

export function LibraryBrowser({ items }: { items: LibraryItem[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const shown = items.filter((i) => i.appName.toLowerCase().includes(q.trim().toLowerCase()) && (filter === "all" || i.difficulty === filter));
  const count = (d: Difficulty) => items.filter((i) => i.difficulty === d).length;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="card-flat flex min-w-[14rem] flex-1 items-center gap-2 !rounded-full px-4 focus-within:border-[var(--accent)] sm:max-w-sm">
          <Icon name="search" className="h-4 w-4 text-muted" />
          <label htmlFor="q" className="sr-only">Look up an app in the library</label>
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Look up an app, e.g. gmail" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted focus-visible:outline-none" />
        </div>
        <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === "all" ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2 hover:border-ink"}`}>All · {items.length}</button>
          {DIFF_ORDER.filter((d) => count(d) > 0).map((d) => (
            <button key={d} type="button" onClick={() => setFilter(d)} aria-pressed={filter === d} className={`tone-${d} inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === d ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2 hover:border-ink"}`}>
              <span className="dot" />{DIFF_TEXT[d]} · {count(d)}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <li key={i.slug}>
            <Link href={`/guide/${i.slug}`} className={`tone-${i.difficulty} card group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--tone)]`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AppTile name={i.appName} tone={i.difficulty} />
                  <div>
                    <p className="text-lg font-semibold leading-tight text-ink">{i.appName}</p>
                    <div className="mt-1"><LevelLadder level={i.attemptLevel as "L1" | "L2" | "L3"} compact /></div>
                  </div>
                </div>
                <DifficultyBadge difficulty={i.difficulty} confidence={i.confidence} range={i.range} />
              </div>
              <div className="mt-4"><DifficultyScale difficulty={i.difficulty} range={i.range} /></div>
              <p className="mt-4 line-clamp-4 flex-1 text-sm leading-relaxed text-ink-2">{i.summary}</p>
              {i.counts && (
                <div className="mt-4">
                  <EvidenceBar counts={i.counts} height="h-1.5" />
                  <p className="mt-1.5 text-xs text-muted">{EVIDENCE_ORDER.filter((k) => i.counts![k]).map((k) => `${i.counts![k]} ${EVIDENCE_TEXT[k].toLowerCase()}`).join(" · ")}</p>
                </div>
              )}
              <p className="mt-4 flex items-center justify-between text-sm font-semibold text-ink">
                <span>{i.isFixture ? "Fake fixture" : "Open the guide"}</span>
                <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <div className="card-flat mt-6 p-8 text-center">
          <p className="display text-2xl">No library guide matches</p>
          <p className="mt-1 text-sm text-muted">Nothing in the library fits “{q}”. You can generate a live guide for it above.</p>
        </div>
      )}
    </div>
  );
}
