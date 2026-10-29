# Notion - OAuth app registration research notes

Retrieved 2026-10-29. Read-only research (public docs fetched; no logins, no accounts touched).
Labels: Documented = official; Reported = community/third-party; Unverified = inferred/conflicting.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|---|---|---|---|
| N1 | Authorization (OAuth) guide | https://developers.notion.com/guides/get-started/authorization | official | 2026-10-29 |
| N2 | Getting started / connection types | https://developers.notion.com/guides/get-started/getting-started | official | 2026-10-29 |
| N3 | Public integrations/connections | https://developers.notion.com/guides/get-started/public-integrations | official | 2026-10-29 |
| N4 | Create an integration (PAT page) | https://developers.notion.com/guides/get-started/create-a-notion-integration | official | 2026-10-29 |
| N5 | Marketplace listing | https://developers.notion.com/guides/get-started/marketplace-listing | official | 2026-10-29 |
| N6 | Publishing to the Integration Gallery | https://developers.notion.com/guides/get-started/publishing-integrations-to-notions-integration-gallery | official | 2026-10-29 |
| N7 | Request limits | https://developers.notion.com/reference/request-limits | official | 2026-10-29 |
| N8 | Build an MCP client (OAuth/DCR) | https://developers.notion.com/guides/mcp/build-mcp-client | official | 2026-10-29 |
| N9 | mcp.notion.com OAuth AS metadata | https://mcp.notion.com/.well-known/oauth-authorization-server | official | 2026-10-29 (observed) |
| N10 | mcp.notion.com protected-resource metadata | https://mcp.notion.com/.well-known/oauth-protected-resource | official | 2026-10-29 (observed via curl) |
| N11 | Nango: register your own Notion OAuth app | https://nango.dev/docs/api-integrations/notion/how-to-register-your-own-notion-oauth-app | third-party | 2026-10-29 |
| N12 | Notion Developer Terms (notion.notion.site copy) | https://notion.notion.site/Developer-Terms-ba4131408d0844e08330da2cbb225c20 | official-hosted, text not extractable | 2026-10-29 (search snippet only) |
| N13 | Changelog: updated developer terms | https://developers.notion.com/changelog/updated-developers-terms | official | 2026-10-29 (search snippet only) |
| N14 | Notion legal index | https://app.notion.com/legal | official | 2026-10-29 (401, could not fetch) |

## 2. Registration path

- Developer portal: the task brief says notion.so/my-integrations redirects to /developers/connections; https://developers.notion.com/developers/connections returned 404 for me (fetch without login). Exact portal URL: NOT FOUND / could not fetch. Nango (N11, Reported, may be dated) says: My Integrations > "+ New integration" > choose Public.
- Public connection creation requires (N3, Documented): name and development workspace, redirect URI(s), installation scope "Any workspace" or "Selected workspaces only" (fixed after creation), capabilities.
- Credentials: client ID and client secret on the Configuration tab (N1, Documented). The Authorization URL field only populates after the public connection is "submitted for review" (N1 image caption, Documented). Unverified: what exactly "submit for review" means and whether it gates OAuth use in the owner's own workspace. N11 says you switch type to Public, add redirect, then copy ID/secret directly (Reported, no review mentioned). Conflict - flag. You can construct the authorize URL yourself from client_id and redirect_uri (N1 shows the params) - Unverified whether it works pre-review.
- Works immediately in own workspace: NOT stated (N1). Unverified.
- Other workspaces/users: N5 says public connections work through OAuth without a Marketplace listing (Documented).
- Internal connections need a workspace owner to create (N1, Documented). Whether public connections need owner/admin or a paid plan: NOT stated. Personal access tokens on Business/Enterprise are restricted by default until an owner enables them (N4).
- Auth: authorize with `owner=user`; token exchange POST /v1/oauth/token with Basic auth; response has access token, refresh token, bot_id (N1).

## 3. Review / approval

- Public OAuth use: no documented review (N5: listing optional, works without it). But see authorization URL caveat above.
- Marketplace listing: Notion reviews every submission (N5, N6); also N2 says public connections "must undergo a Notion security review" before Marketplace listing (Documented, N2). Depth: manual / possibly security_assessment - the security review process itself is NOT described (N5 says it does not cover security review).
- Documented wait: 5-10 business days by email (N5, N6).
- Reported waits/rejections: none found in community sources (searches returned only official pages) - NOT FOUND.
- Documented rejection reasons (N6): brand/trademark issues, quality concerns, baseline criteria not met; resubmit allowed.
- Eligibility: only "Any workspace" scope can be listed (N5).
- Contact for questions: developers@makenotion.com (via search summary of docs, Reported-from-official).

## 4. Scopes and nuances

- No granular OAuth scopes in the Slack sense; capabilities (read/update/insert content, etc.) are chosen on the connection (N3). Users pick pages at consent time; integration can only access shared pages (N1, N11).
- Tokens: N1 documents access token + refresh token; refresh returns new pair. Token expiry duration not stated. N11 (Reported) claims no refresh tokens and no expiry - CONFLICT with official N1; trust N1, flag as Unverified/possibly dated.
- Rate limits (N7): 600 req/min per connection on Business/Enterprise, 180 on other plans; separate per-workspace budget; data source queries ~3 req/s.
- Installation scope "Selected workspaces only" cannot be listed on Marketplace and cannot be changed later.
- Re-authorization by existing users uses the same URL (changelog snippet, Reported-from-official).

## 5. Special requirements

- For Marketplace: listing name, description, category, tags, images, logo (N5). Privacy policy, support contact requirements are NOT covered on N5 (points to Best Practices guide, not fetched). Brand/trademark compliance matters.
- Developer Terms accepted when using API (N12 snippet).

## 6. Provider public OAuth metadata

- https://www.notion.so/.well-known/oauth-authorization-server: 404 (observed, WebFetch and curl).
- https://api.notion.com/.well-known/oauth-authorization-server: 400 (observed).
- https://mcp.notion.com/.well-known/oauth-authorization-server: exists. Has registration_endpoint https://mcp.notion.com/register, plus authorization, token, revocation, introspection endpoints (N9, observed).
- https://mcp.notion.com/.well-known/oauth-protected-resource: exists, authorization_servers = https://mcp.notion.com, scope "default" (N10, observed).
- N8 documents RFC 7591 dynamic client registration and CIMD support for the Notion MCP server. This is for MCP, not the classic REST public-connection OAuth; the classic flow needs a manually registered client.

## 7. FREE-PATH FEASIBILITY

- Free account can create app and get credentials? Plausibly yes for creating a connection (N3 lists no plan requirement) but Unverified; the Authorization URL appearing only after "submit for review" (N1) is an unresolved risk. PAT creation noted as restricted on Business/Enterprise only (N4), implying free workspaces are not restricted (inference, Unverified).
- First human-only step: sign in to Notion (email code/Google SSO), possibly creating a workspace.
- Estimated minutes to credentials: ~5-10 (Unverified estimate), longer if a review step is truly required.
- Pages visited (expected): developers portal Connections list, New connection form, Configuration tab. Exact URLs NOT FOUND / could not fetch (login-gated).
- No live test performed.

## 8. Terms on automation

- Developer Terms (N12): per search snippet, limited revocable license to the API; bars replicating or reverse engineering the Services. Full clause text could not be extracted. Section numbers: NOT FOUND.
- Main Terms of Service / AUP: could not fetch (app.notion.com/legal returned 401; other URLs 404). Automated-access/scraping language: NOT FOUND / could not fetch.
- Plain reading: unknown. Driving the developer portal UI via an agent is not addressed in anything I could read. Confidence: low. Flag: AMBIGUOUS/UNREAD. Not legal advice.

## 9. Surprises

- Authorization URL populated only after "submit for review" (N1) vs third-party guide saying just copy ID/secret.
- Docs say refresh tokens exist; third-party says they do not.
- developers.notion.com/developers/connections returned 404 without login.
- Notion MCP server supports DCR (rare), while classic API does not.
- Docs say "security review" is needed before Marketplace but N5 says 5-10 business days with no mention of security review.

## 10. Suggested difficulty factors

- registration_friction: account_needed (N3; plan requirement not stated)
- review_required: for_public_use is Unverified (N1 hint that review gates authorization URL); N5 says listing optional - suggest `none` for OAuth use, `for_public_use` flagged Unverified
- review_depth: manual (N5, N6); N2 says security review - treat as manual with possible security_assessment for Marketplace
- docs_quality: partial (N1, N5 clear but gaps: review meaning, privacy/support requirements, plan/role requirements, token expiry)
- approval_wait_basis: documented (5-10 business days, N5/N6) for Marketplace; reported: none
- special_requirements: listing_assets (logo, images, description), brand_compliance, redirect_uri, installation_scope_choice_irreversible
