import type { Source } from "@/lib/schema/guide";

const COMMUNITY_HOSTS = ["stackoverflow.com", "stackexchange.com", "reddit.com", "news.ycombinator.com", "dev.to", "discourse.org"];
const COMPOSIO_HOSTS = ["composio.dev"];

export const hostOf = (u: string): string => {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return "";
  }
};
const underDomain = (host: string, d: string) => host === d || host.endsWith("." + d);

/**
 * Publisher heuristic (spec 6.1). Provider-run forums ("community.*", "forum.*") are community, not official.
 * Composio's own docs count as official only for Composio-status claims; the prompts say so.
 */
export function classifyPublisher(url: string, providerDomains: string[]): Source["publisher"] {
  const host = hostOf(url);
  const path = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();
  if (!host) return "third_party";
  if (COMMUNITY_HOSTS.some((d) => underDomain(host, d))) return "community";
  // Provider-hosted forums, discussions and issue threads are user content, not official statements.
  if (/(community|forum|discuss)/.test(host)) return "community";
  if (/\/(discussions|issues|pull)\/\d+|\/orgs\/community\/|\/community\/|\/questions\/\d+|\/t\/[^/]+\/\d+/.test(path)) return "community";
  if (providerDomains.some((d) => underDomain(host, d.toLowerCase()))) return "official";
  if (COMPOSIO_HOSTS.some((d) => underDomain(host, d))) return "official";
  return "third_party";
}

/** Canonical key for dedupe: https, no fragment, no trailing slash, no tracking params. */
export function normalizeUrl(u: string): string {
  try {
    const x = new URL(u);
    x.hash = "";
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|ref$|fbclid|gclid)/.test(k)) x.searchParams.delete(k);
    x.protocol = "https:";
    return x.toString().replace(/\/$/, "");
  } catch {
    return u;
  }
}

/** Only https URLs are kept as sources (schema requires it). */
export const isHttps = (u: string) => u.startsWith("https://");

/** Wrap untrusted fetched text so the model treats it as data (spec 9.2). */
export function wrapUntrusted(id: string, url: string, text: string): string {
  const safe = text.replace(/<<<|>>>/g, "").slice(0, 8000);
  return `<<<UNTRUSTED_SOURCE id=${id} url=${url}>>>\n${safe}\n<<<END_UNTRUSTED_SOURCE>>>`;
}
