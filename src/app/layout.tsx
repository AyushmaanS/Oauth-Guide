import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { NavLinks } from "@/components/NavLinks";
import { Icon, Logo } from "@/components/ui";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "OAuthPath", template: "%s · OAuthPath" },
  description:
    "How hard is it to register your own OAuth app with a provider? Verdict-first guides with every claim labelled by evidence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
        <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--paper)_82%,transparent)] backdrop-blur-md">
          <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:gap-2">
            <Link href="/" className="mr-1 flex shrink-0 items-center gap-2 sm:mr-3" aria-label="OAuthPath home">
              <Logo />
              <span className="display text-lg">OAuthPath</span>
            </Link>
            <NavLinks />
            <Link href="/#generate" className="btn btn-primary ml-auto shrink-0 !px-3.5 !py-1.5">
              <Icon name="sparkles" /> <span className="hidden sm:inline">Generate a guide</span><span className="sm:hidden">Generate</span>
            </Link>
          </nav>
        </header>
        <div id="content" className="flex-1">{children}</div>
        <footer className="mt-20 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted">
            <div className="flex items-center gap-2"><Logo className="h-5 w-5" /><span className="display text-base text-ink">OAuthPath</span></div>
            <p className="max-w-xl">Guides are research aids, not legal or compliance advice. Check the sources, and check the date a guide was generated.</p>
            <Link href="/about" className="font-medium text-ink underline underline-offset-4">How it works</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
