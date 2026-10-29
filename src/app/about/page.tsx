import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it works" };

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">How OAuthPath works</h1>
      <p className="mt-2 text-gray-800">This page is a skeleton; the full method, rubric and limits are written in Sprint 6.</p>
      <h2 className="mt-8 text-xl font-semibold">Evidence labels</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li><strong>Tested</strong>: we observed it directly, and only up to the gate we reached.</li>
        <li><strong>Documented</strong>: an official provider source says so (linked, with retrieval date).</li>
        <li><strong>Reported</strong>: only community or third-party sources say so.</li>
        <li><strong>Unverified</strong>: inferred, conflicting, or unsourced.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Attempt levels</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li><strong>L1</strong> docs read · <strong>L2</strong> gate probed (public path followed to the first gate) · <strong>L3</strong> signed-in walkthrough with a free account, stopped at the first human-only step.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Difficulty</h2>
      <p className="mt-2 text-sm">Easy, Moderate, Hard or Gated is computed by code from enumerated factors, never chosen by an AI model. The owner of each step (agent, you, provider wait) is also computed by code from requirement tags.</p>
    </main>
  );
}
