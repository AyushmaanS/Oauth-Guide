import type { Actor, Difficulty, Guide } from "@/lib/schema/guide";

const DIFF: Record<Difficulty, { text: string; cls: string }> = {
  easy: { text: "Easy", cls: "bg-green-100 text-green-900 border-green-700" },
  moderate: { text: "Moderate", cls: "bg-yellow-100 text-yellow-900 border-yellow-700" },
  hard: { text: "Hard", cls: "bg-orange-100 text-orange-900 border-orange-700" },
  gated: { text: "Gated", cls: "bg-red-100 text-red-900 border-red-700" },
  unknown: { text: "Unknown", cls: "bg-gray-100 text-gray-900 border-gray-500 border-dashed" },
};

export function DifficultyBadge({ difficulty, large }: { difficulty: Difficulty; large?: boolean }) {
  const d = DIFF[difficulty];
  return (
    <span className={`inline-block rounded border font-semibold ${d.cls} ${large ? "px-3 py-1 text-xl" : "px-2 py-0.5 text-xs"}`}>
      {d.text}
    </span>
  );
}

const LEVEL_TIP: Record<Guide["attemptLevel"], string> = {
  L1: "L1 — Docs read: sources were read and synthesized. Nothing was observed directly.",
  L2: "L2 — Gate probed: step URLs were requested read-only and the public path followed to the first access gate.",
  L3: "L3 — Signed-in walkthrough: a free-account walkthrough in a real browser up to the first human-only step.",
};

export function AttemptLevelBadge({ level }: { level: Guide["attemptLevel"] }) {
  return (
    <span title={LEVEL_TIP[level]} className="inline-flex cursor-help items-center rounded border border-indigo-700 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-900">
      Attempt level {level}
    </span>
  );
}

const ACTOR: Record<Actor, { text: string; icon: string; cls: string }> = {
  agent: { text: "Agent", icon: "🤖", cls: "bg-sky-50 text-sky-900 border-sky-700" },
  you: { text: "You", icon: "👤", cls: "bg-rose-50 text-rose-900 border-rose-700" },
  provider_wait: { text: "Waiting on provider", icon: "⏳", cls: "bg-gray-100 text-gray-900 border-gray-600" },
};

export function ActorChip({ actor }: { actor: Actor }) {
  const a = ACTOR[actor];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${a.cls}`}>
      <span aria-hidden="true">{a.icon}</span>
      {a.text}
    </span>
  );
}
