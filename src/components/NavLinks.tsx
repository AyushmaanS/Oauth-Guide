"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/#library", label: "Library", match: (p: string) => p === "/" || p.startsWith("/guide"), hideSmall: true },
  { href: "/about", label: "How it works", match: (p: string) => p.startsWith("/about") },
];

export function NavLinks() {
  const path = usePathname() ?? "/";
  return (
    <>
      {LINKS.map((l) => {
        const active = l.match(path);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={`${l.hideSmall ? "hidden sm:inline-flex" : ""} whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}>
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
