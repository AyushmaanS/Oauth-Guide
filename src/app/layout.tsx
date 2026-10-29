import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "OAuthPath", template: "%s · OAuthPath" },
  description:
    "How hard is it to register your own OAuth app with a provider? Verdict-first guides with every claim labelled by evidence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-gray-200">
          <nav aria-label="Main" className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold">OAuthPath</Link>
            <Link href="/" className="text-sm text-gray-700 hover:underline">Library</Link>
            <Link href="/about" className="text-sm text-gray-700 hover:underline">How it works</Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-600">
          Guides are research aids, not legal or compliance advice. Check the sources.
        </footer>
      </body>
    </html>
  );
}
