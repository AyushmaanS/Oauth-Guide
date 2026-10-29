"use client";
import Link from "next/link";
import { useState } from "react";
import type { Difficulty } from "@/lib/schema/guide";
import { DifficultyBadge } from "./badges";

export interface LibraryItem {
  slug: string;
  appName: string;
  difficulty: Difficulty;
  summary: string;
  attemptLevel: string;
  isFixture: boolean;
}

export function LibraryBrowser({ items }: { items: LibraryItem[] }) {
  const [q, setQ] = useState("");
  const shown = items.filter((i) => i.appName.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      <label htmlFor="q" className="block text-sm font-medium">Look up an app in the library</label>
      <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. gmail"
        className="mt-1 w-full rounded border border-gray-500 px-3 py-2" />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {shown.map((i) => (
          <li key={i.slug}>
            <Link href={`/guide/${i.slug}`} className="block h-full rounded border border-gray-300 p-4 hover:border-gray-900">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{i.appName}</span>
                <DifficultyBadge difficulty={i.difficulty} />
              </div>
              <p className="mt-2 text-sm text-gray-800">{i.summary}</p>
              <p className="mt-2 text-xs text-gray-700">Attempt level {i.attemptLevel}{i.isFixture ? " · fake fixture" : ""}</p>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-4 text-sm text-gray-700">No library guide matches “{q}”. Live generation arrives in a later sprint.</p>}
    </div>
  );
}
