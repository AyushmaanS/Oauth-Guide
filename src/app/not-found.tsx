import Link from "next/link";
import { Icon } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="contours">
      <div className="mx-auto max-w-2xl px-4 py-24">
        <p className="eyebrow flex items-center gap-2"><Icon name="pin" className="h-3.5 w-3.5" /> Off the map</p>
        <h1 className="display mt-3 text-5xl leading-tight sm:text-6xl">We don&apos;t have that guide yet</h1>
        <p className="mt-4 text-lg text-ink-2">
          Library guides cover a handful of apps. For any other app you can generate a lighter guide live; it takes about two minutes.
        </p>
        <form action="/" method="get" className="card mt-8 flex items-center gap-2 !rounded-full p-1.5 pl-5">
          <Icon name="search" className="h-5 w-5 text-muted" />
          <label htmlFor="nf-q" className="sr-only">App name or website</label>
          <input id="nf-q" name="q" maxLength={120} required placeholder="e.g. Zoom, or zoom.us" className="min-w-0 flex-1 bg-transparent py-2.5 outline-none placeholder:text-muted focus-visible:outline-none" />
          <button type="submit" className="btn btn-primary !px-5 !py-2.5">Generate a guide <Icon name="arrow" /></button>
        </form>
        <Link href="/#library" className="btn mt-4">Back to the library</Link>
      </div>
    </main>
  );
}
