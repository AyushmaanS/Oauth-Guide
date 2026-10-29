/**
 * Sprint 0 assumption spike. Run: npx tsx --env-file=.env.local scripts/spike-env.ts
 * Prints results and writes docs/spike-results.json. Never prints keys.
 */
import OpenAI from "openai";
import { tavily } from "@tavily/core";
import { z } from "zod";
import dns from "node:dns/promises";
import net from "node:net";
import fs from "node:fs";

const BASE = process.env.FASTROUTER_BASE_URL || "https://go.fastrouter.ai/api/v1";
const client = new OpenAI({ apiKey: process.env.FASTROUTER_API_KEY, baseURL: BASE });
const CANDIDATES = (process.env.SPIKE_MODELS ||
  "anthropic/claude-haiku-5.5,google/gemini-3.8-flash,anthropic/claude-sonnet-5.5,anthropic/claude-opus-5.5").split(",");
const out: Record<string, unknown> = { date: new Date().toISOString(), base: BASE };

const ms = async <T>(f: () => Promise<T>) => {
  const t = Date.now();
  try {
    return { ok: true as const, value: await f(), ms: Date.now() - t };
  } catch (e) {
    return { ok: false as const, error: String((e as Error).message).slice(0, 200), ms: Date.now() - t };
  }
};

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), query: z.string().max(120), reason: z.string(), targets: z.array(z.string()) }),
  z.object({ action: z.literal("read"), url: z.string().url(), reason: z.string(), targets: z.array(z.string()) }),
  z.object({ action: z.literal("finish"), reason: z.string() }),
]);
const ACTION_PROMPT = `You are a research agent. Respond with ONE JSON object only, no prose, no code fences.
Schema: {"action":"search","query":string,"reason":string,"targets":string[]} | {"action":"read","url":string,"reason":string,"targets":string[]} | {"action":"finish","reason":string}
Goal: find how to register an OAuth app for the "Example" API. Checklist: registration, review_process. Nothing found yet. Choose your next action.`;

function parseJson(s: string) {
  const t = s.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(t);
}

async function modelTests(model: string) {
  const r: Record<string, unknown> = {};
  const plain = await ms(() =>
    client.chat.completions.create({ model, messages: [{ role: "user", content: "Reply with the single word: pong" }], max_tokens: 20 }),
  );
  r.plain = plain.ok ? { ok: true, ms: plain.ms, text: plain.value.choices[0]?.message?.content?.slice(0, 40) } : plain;

  const jm = await ms(() =>
    client.chat.completions.create({
      model,
      messages: [{ role: "user", content: 'Return JSON {"a": 1, "b": ["x"]} exactly.' }],
      response_format: { type: "json_object" },
      max_tokens: 100,
    }),
  );
  r.jsonMode = jm.ok ? { ok: true, ms: jm.ms, parsed: safe(() => parseJson(jm.value.choices[0]?.message?.content || "")) } : jm;

  const js = await ms(() =>
    client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Give name 'x' and count 2." }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "r", strict: true, schema: { type: "object", properties: { name: { type: "string" }, count: { type: "number" } }, required: ["name", "count"], additionalProperties: false } },
      },
      max_tokens: 100,
    }),
  );
  r.jsonSchema = js.ok ? { ok: true, ms: js.ms, parsed: safe(() => parseJson(js.value.choices[0]?.message?.content || "")) } : js;

  const tc = await ms(() =>
    client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "What is the weather in Paris? Use the tool." }],
      tools: [{ type: "function", function: { name: "get_weather", description: "weather", parameters: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } } }],
      max_tokens: 100,
    }),
  );
  r.toolCalling = tc.ok ? { ok: true, ms: tc.ms, calledTool: !!tc.value.choices[0]?.message?.tool_calls?.length } : tc;

  const st = await ms(async () => {
    const s = await client.chat.completions.create({ model, messages: [{ role: "user", content: "Count from 1 to 15 separated by spaces." }], stream: true, max_tokens: 100 });
    let chunks = 0, firstMs = -1;
    const t0 = Date.now();
    for await (const c of s) {
      if (c.choices?.[0]?.delta?.content) { chunks++; if (firstMs < 0) firstMs = Date.now() - t0; }
    }
    return { chunks, firstTokenMs: firstMs };
  });
  r.streaming = st.ok ? { ok: true, ms: st.ms, ...st.value } : st;

  // JSON-action protocol, 10 trials, no response_format (plain prompt), zod-validated
  let valid = 0, parsedOnly = 0;
  const lat: number[] = [];
  const fails: string[] = [];
  await Promise.all(
    Array.from({ length: 10 }, async () => {
      const t = await ms(() => client.chat.completions.create({ model, messages: [{ role: "user", content: ACTION_PROMPT }], max_tokens: 300 }));
      lat.push(t.ms);
      if (!t.ok) { fails.push(t.error); return; }
      const txt = t.value.choices[0]?.message?.content || "";
      try {
        const j = parseJson(txt);
        parsedOnly++;
        if (Action.safeParse(j).success) valid++;
        else fails.push("schema:" + JSON.stringify(j).slice(0, 80));
      } catch {
        fails.push("notjson:" + txt.slice(0, 60));
      }
    }),
  );
  lat.sort((a, b) => a - b);
  r.jsonActionProtocol = { trials: 10, parsed: parsedOnly, validAgainstZod: valid, medianMs: lat[5], fails: fails.slice(0, 3) };
  return r;
}
function safe<T>(f: () => T) { try { return f(); } catch { return "PARSE_FAILED"; } }

async function tavilyTests() {
  const t = tavily({ apiKey: process.env.TAVILY_API_KEY! });
  const s = await ms(() => t.search("GitHub OAuth app registration documentation", { maxResults: 5 }));
  const first = s.ok ? s.value.results[0]?.url : undefined;
  const e = first ? await ms(() => t.extract([first])) : null;
  return {
    search: s.ok ? { ok: true, ms: s.ms, results: s.value.results.length, sample: s.value.results.slice(0, 3).map((x) => x.url) } : s,
    extract: e ? (e.ok ? { ok: true, ms: e.ms, url: first, chars: e.value.results[0]?.rawContent?.length } : e) : "skipped",
  };
}

const DOMAINS = [
  "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app",
  "https://github.com/settings/developers",
  "https://github.com/login/oauth/authorize",
  "https://developers.google.com/identity/protocols/oauth2",
  "https://console.cloud.google.com/apis/credentials",
  "https://accounts.google.com/.well-known/openid-configuration",
  "https://api.slack.com/authentication/oauth-v2",
  "https://api.slack.com/apps",
  "https://developers.notion.com/docs/authorization",
  "https://www.notion.so/my-integrations",
  "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication",
  "https://developer.linkedin.com/",
  "https://www.linkedin.com/developers/apps",
];
async function reach() {
  return Promise.all(
    DOMAINS.map(async (u) => {
      const r = await ms(async () => {
        const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "OAuthPathBot/1.0 (spike)" } });
        return { status: res.status, location: res.headers.get("location")?.slice(0, 100), server: res.headers.get("server") };
      });
      return { url: u, ...(r.ok ? { ...r.value, ms: r.ms } : { error: r.error }) };
    }),
  );
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const l = ip.toLowerCase();
  return l === "::1" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:127.") || l.startsWith("::ffff:10.") || l.startsWith("::ffff:192.168.");
}
async function dnsCheck() {
  const cases = ["docs.github.com", "localhost", "metadata.google.internal", "127.0.0.1.nip.io"];
  const res = [];
  for (const h of cases) {
    const r = await ms(() => dns.lookup(h, { all: true }));
    res.push({ host: h, ...(r.ok ? { ips: r.value.map((x) => x.address), anyPrivate: r.value.some((x) => isPrivateIp(x.address)) } : { error: r.error }) });
  }
  return { nodeVersion: process.version, cases: res, unitChecks: { "169.254.169.254": isPrivateIp("169.254.169.254"), "10.1.2.3": isPrivateIp("10.1.2.3"), "8.8.8.8": isPrivateIp("8.8.8.8"), "::1": isPrivateIp("::1") } };
}

async function composio() {
  const urls = [
    "https://docs.composio.dev/toolkits/managed-auth",
    "https://docs.composio.dev/llms.txt",
    "https://docs.composio.dev/toolkits/managed-auth.md",
    "https://docs.composio.dev/toolkits/github",
    "https://docs.composio.dev/toolkits/github.md",
  ];
  return Promise.all(
    urls.map(async (u) => {
      const r = await ms(async () => {
        const res = await fetch(u, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "OAuthPathBot/1.0 (spike)" } });
        const body = await res.text();
        const lower = body.toLowerCase();
        return { status: res.status, type: res.headers.get("content-type")?.slice(0, 40), bytes: body.length, mentionsGithub: lower.includes("github"), mentionsManaged: lower.includes("managed"), mentionsGmail: lower.includes("gmail") };
      });
      return { url: u, ...(r.ok ? r.value : { error: r.error }) };
    }),
  );
}

async function main() {
  const list = await ms(() => client.models.list());
  const ids = list.ok ? list.value.data.map((m) => m.id) : [];
  out.models = { ok: list.ok, count: ids.length, candidatesAvailable: Object.fromEntries(CANDIDATES.map((c) => [c, ids.includes(c)])) };
  console.log("models:", JSON.stringify(out.models));
  const per: Record<string, unknown> = {};
  await Promise.all(CANDIDATES.map(async (m) => { per[m] = await modelTests(m); console.log("done", m); }));
  out.modelTests = per;
  out.tavily = await tavilyTests();
  out.reachability = await reach();
  out.dnsCheck = await dnsCheck();
  out.composio = await composio();
  fs.writeFileSync("docs/spike-results.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}
main();
