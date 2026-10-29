import { z } from "zod";
import { callJson } from "@/lib/llm";
import { wrapUntrusted } from "./gather/sources";
import { RESOLVE_SYSTEM } from "./prompts/resolve";
import type { Deps, Resolved } from "./types";

export class InputError extends Error {}

const PRIVATE_HOST = /^(localhost|.*\.(local|internal|localhost|test|lan|corp|home))$/i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export interface ValidInput {
  kind: "name" | "url";
  value: string;
  host?: string;
}

/** Input validation and normalisation (spec 6.1, 9.1). Never fetches anything. */
export function validateInput(raw: string): ValidInput {
  const value = raw.trim();
  if (!value) throw new InputError("Enter an app name or website.");
  if (value.length > 120) throw new InputError("That is too long (120 characters max).");
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new InputError("Control characters are not allowed.");
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || (/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(value) && !/\s/.test(value));
  if (!looksLikeUrl) return { kind: "name", value };
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    throw new InputError("That does not look like a valid website.");
  }
  if (!/^https?:$/.test(url.protocol)) throw new InputError("Only http and https websites are accepted.");
  const host = url.hostname.toLowerCase();
  if (IPV4.test(host) || host.includes(":") || host.startsWith("[")) throw new InputError("IP addresses are not accepted. Use the app's website name.");
  if (PRIVATE_HOST.test(host) || !host.includes(".")) throw new InputError("Internal or local addresses are not accepted.");
  return { kind: "url", value, host };
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "app";

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const ResolveOut = z.object({
  appName: z.string().min(1).max(80),
  providerSite: z.string().min(3).max(100),
  providerDomains: z.array(z.string()).min(1).max(8),
  supportsOAuth: z.enum(["yes", "no", "unclear"]),
  docsUrls: z.array(z.string()).max(6),
  note: z.string().max(300),
});

export async function resolveApp(input: ValidInput, deps: Deps, model: string): Promise<Resolved> {
  const q = input.kind === "url" ? `${input.host} developer OAuth documentation` : `${input.value} developer OAuth documentation`;
  const hits = await deps.search.search(q, 6);
  const bundle = hits.map((h, i) => wrapUntrusted(`r${i + 1}`, h.url, `${h.title}\n${h.snippet}`)).join("\n");
  const out = await callJson({
    llm: deps.llm,
    model,
    system: RESOLVE_SYSTEM,
    user: `User input (${input.kind}): ${JSON.stringify(input.value)}\n\nSearch results (untrusted data):\n${bundle}`,
    schema: ResolveOut,
    maxTokens: 800,
  });
  const clean = (d: string) => d.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const providerDomains = [...new Set(out.providerDomains.map(clean).filter((d) => HOST_RE.test(d)))];
  if (!providerDomains.length) throw new Error("Could not determine the provider's domain");
  const site = clean(out.providerSite);
  return {
    appName: out.appName.trim(),
    slug: slugify(out.appName),
    providerSite: HOST_RE.test(site) ? site : providerDomains[0],
    providerDomains,
    supportsOAuth: out.supportsOAuth,
    docsUrls: out.docsUrls.filter((u) => u.startsWith("https://")).slice(0, 4),
    note: out.note,
    hits,
  };
}
