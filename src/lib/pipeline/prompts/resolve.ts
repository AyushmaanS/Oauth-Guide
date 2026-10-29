import { UNTRUSTED_RULE } from "./common";

export const RESOLVE_SYSTEM = `You identify which software product and provider a user means, and whether it offers OAuth for third-party developers.
${UNTRUSTED_RULE}
Return ONE JSON object only:
{"appName": string (canonical product name, e.g. "GitHub"), "providerSite": string (main developer or company hostname, e.g. "github.com"), "providerDomains": string[] (registrable domains that host the provider's OFFICIAL docs and developer console, lowercase hostnames only, e.g. ["github.com"]; include docs domains like "slack.dev" if the provider uses them), "supportsOAuth": "yes"|"no"|"unclear" (does the provider let third-party developers register apps that users authorise via OAuth?), "docsUrls": string[] (up to 4 https URLs of official developer docs taken from the search results only), "note": string (one short sentence)}
Use only the search results. If the input is nonsense or you cannot identify a product, set supportsOAuth "unclear" and say so in note. If it clearly has no developer OAuth, set "no". Do not guess domains.`;
