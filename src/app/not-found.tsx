import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">We don&apos;t have that guide yet</h1>
      <p className="mt-2 text-gray-700">
        Library guides cover a handful of apps. For any other app you can generate a lighter guide live; it takes about two minutes.
      </p>
      <form action="/" method="get" className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="nf-q" className="sr-only">App name or website</label>
        <input id="nf-q" name="q" maxLength={120} required placeholder="e.g. Zoom, or zoom.us" className="min-w-0 flex-1 rounded border border-gray-700 px-3 py-2" />
        <button type="submit" className="rounded border border-gray-900 bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">Generate a guide</button>
      </form>
      <Link href="/" className="mt-4 inline-block rounded border border-gray-900 px-3 py-1 hover:bg-gray-100">Back to the library</Link>
    </main>
  );
}
