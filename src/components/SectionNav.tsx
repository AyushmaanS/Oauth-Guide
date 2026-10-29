"use client";
import { useEffect, useState } from "react";

/** Scroll-spy section navigation: a left rail on large screens, a sticky scrolling pill bar on small ones. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const seen = new Set<string>();
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        const first = items.find((i) => seen.has(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [items]);
  return (
    <nav aria-label="On this page" className="sticky top-14 z-30 -mx-4 overflow-x-auto bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] px-4 py-2 backdrop-blur-md lg:top-24 lg:mx-0 lg:overflow-visible lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <p className="eyebrow mb-2 hidden lg:block">On this page</p>
      <ul className="flex gap-1.5 lg:flex-col lg:gap-0.5">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined}
              className={`block whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors lg:rounded-lg lg:border-0 lg:border-l-2 lg:rounded-l-none lg:px-3 lg:py-1.5 ${active === i.id ? "border-ink bg-ink text-paper lg:bg-transparent lg:!border-l-[var(--accent)] lg:font-semibold lg:text-ink" : "border-line text-muted hover:text-ink lg:border-transparent"}`}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
