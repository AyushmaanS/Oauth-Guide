import { LibraryBrowser, type LibraryItem } from "@/components/LibraryBrowser";
import { getLibraryGuides } from "@/lib/guides";

export default function Home() {
  const items: LibraryItem[] = getLibraryGuides().map((g) => ({
    slug: g.slug,
    appName: g.appName,
    difficulty: g.verdict.difficulty,
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
      <form className="mt-6" aria-describedby="gen-note">
        <label htmlFor="gen" className="block text-sm font-medium">Generate a guide for any app (name or website)</label>
        <div className="mt-1 flex gap-2">
          <input id="gen" disabled placeholder="Coming soon" className="w-full rounded border border-gray-400 bg-gray-100 px-3 py-2" />
          <button type="button" disabled className="rounded bg-gray-300 px-4 py-2 text-gray-700">Generate</button>
        </div>
        <p id="gen-note" className="mt-1 text-xs text-gray-700">Live generation is built in a later sprint.</p>
      </form>
      <section className="mt-10" aria-labelledby="lib"><h2 id="lib" className="mb-3 text-xl font-semibold">Library</h2><LibraryBrowser items={items} /></section>
    </main>
  );
}
