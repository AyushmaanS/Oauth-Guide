import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">We don&apos;t have that guide yet</h1>
      <p className="mt-2 text-gray-700">Live generation for any app is coming in a later sprint. For now, browse the library.</p>
      <Link href="/" className="mt-4 inline-block rounded border border-gray-900 px-3 py-1 hover:bg-gray-100">Back to the library</Link>
    </main>
  );
}
