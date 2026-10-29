import { z } from "zod";
import type { ProviderMetadata } from "@/lib/schema/guide";
import type { Fetcher } from "./trace";
import { registrable } from "./safefetch";

/** Public OAuth/OIDC metadata (spec 6.7.2). Parsed with zod; the raw document is never stored. */
const Doc = z.object({
  issuer: z.string(),
  authorization_endpoint: z.string().optional(),
  token_endpoint: z.string().optional(),
  registration_endpoint: z.string().optional(),
  scopes_supported: z.array(z.string()).optional(),
  code_challenge_methods_supported: z.array(z.string()).optional(),
  token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
});

export const WELL_KNOWN = ["/.well-known/oauth-authorization-server", "/.well-known/openid-configuration"];
const MAX_LOCATIONS = 4;

const httpsOnly = (u?: string) => (u && u.startsWith("https://") && u.length < 300 ? u : undefined);
const cap = (a: string[] | undefined, n: number) => a?.slice(0, n).map((s) => s.slice(0, 100));

/**
 * The (at most 4) standard locations to try: both well-known paths on the provider's own site, then the OpenID
 * configuration on its sign-in hosts (those discovered while probing, else accounts.<domain> and auth.<domain>).
 */
export function metadataLocations(site: string, domains: string[], discoveredAuthHosts: string[] = []): string[] {
  const urls: string[] = [];
  const primary = site.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  const apex = registrable(primary || domains[0] || "");
  for (const h of [...new Set([primary, apex])].slice(0, 1)) for (const p of WELL_KNOWN) urls.push(`https://${h}${p}`);
  const auth = [...discoveredAuthHosts, `accounts.${apex}`, `auth.${apex}`];
  for (const h of [...new Set(auth)]) urls.push(`https://${h}${WELL_KNOWN[1]}`);
  return [...new Set(urls)].slice(0, MAX_LOCATIONS);
}

/** urls: standard locations from metadataLocations (allow-listed by the caller's fetcher). At most 4 requests. */
export async function checkMetadata(hostsOrUrls: string[], fetch: Fetcher, now = () => new Date()): Promise<ProviderMetadata> {
  const checkedAt = now().toISOString();
  const urls = hostsOrUrls.some((x) => x.startsWith("https://")) ? hostsOrUrls.slice(0, MAX_LOCATIONS) : hostsOrUrls.flatMap((h) => WELL_KNOWN.map((p) => `https://${h}${p}`)).slice(0, MAX_LOCATIONS);
  const notes: string[] = [];
  for (const url of urls) {
    const r = await fetch(url);
    if (r.blocked || r.status !== 200) continue;
    if (r.truncated) { notes.push(`The metadata document at ${new URL(url).host} was larger than we read; ignored.`); continue; }
    let json: unknown;
    try {
      json = JSON.parse(r.body);
    } catch {
      continue; // an HTML page at a well-known path is not metadata
    }
    const doc = Doc.safeParse(json);
    if (!doc.success) continue;
    let issuerHost = "";
    try {
      issuerHost = new URL(doc.data.issuer).hostname;
    } catch {
      /* invalid issuer */
    }
    if (issuerHost !== new URL(url).hostname) {
      notes.push(`Ignored a metadata document whose issuer (${issuerHost || "invalid"}) did not match the host it was fetched from.`);
      continue;
    }
    const d = doc.data;
    const registrationEndpoint = httpsOnly(d.registration_endpoint);
    return {
      checkedAt,
      found: true,
      sourceUrl: url,
      issuer: d.issuer.slice(0, 200),
      ...(httpsOnly(d.authorization_endpoint) ? { authorizationEndpoint: httpsOnly(d.authorization_endpoint) } : {}),
      ...(httpsOnly(d.token_endpoint) ? { tokenEndpoint: httpsOnly(d.token_endpoint) } : {}),
      ...(registrationEndpoint ? { registrationEndpoint } : {}),
      ...(d.scopes_supported ? { scopesListed: cap(d.scopes_supported, 50) } : {}),
      ...(d.code_challenge_methods_supported ? { pkceMethods: cap(d.code_challenge_methods_supported, 10) } : {}),
      ...(d.token_endpoint_auth_methods_supported ? { tokenEndpointAuthMethods: cap(d.token_endpoint_auth_methods_supported, 10) } : {}),
      dynamicRegistration: registrationEndpoint ? "supported" : "not_listed",
      notes: [...notes, registrationEndpoint ? "A registration endpoint is listed, so apps may be registrable without the console (not verified here)." : "No registration endpoint is listed, so manual console registration is likely still needed."],
    };
  }
  return { checkedAt, found: false, dynamicRegistration: "unknown", notes: [...notes, "Not published at the standard locations. That does not mean a feature is unsupported."] };
}
