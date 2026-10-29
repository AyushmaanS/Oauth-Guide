import { GenerateBox } from "@/components/GenerateBox";
import { LibraryBrowser, type LibraryItem } from "@/components/LibraryBrowser";
import { getLibraryGuides } from "@/lib/guides";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const q = (await searchParams).q;
  const initialQuery = typeof q === "string" ? q : "";
  const items: LibraryItem[] = getLibraryGuides().map((g) => ({
    slug: g.slug,
    appName: g.appName,
    difficulty: g.verdict.difficulty,
    confidence: g.verdict.difficultyConfidence,
    range: g.verdict.difficultyRange,
    summary: g.verdict.summary,
    attemptLevel: g.attemptLevel,
    isFixture: g.slug.endsWith("-fixture"),
  }));
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">How hard is it to set up OAuth for this app?</h1>
      <p className="mt-2 max-w-2xl text-gray-800">
        Before you build an integration, see whether registering your own OAuth app is an hour or a month, what blocks approval,
        and what an agent can do versus what you must do. Every claim says how well it is evidenced.
      </p>
      <GenerateBox initialQuery={initialQuery} />
      <section className="mt-10" aria-labelledby="lib"><h2 id="lib" className="mb-3 text-xl font-semibold">Library</h2><LibraryBrowser items={items} /></section>
    </main>
  );
}
