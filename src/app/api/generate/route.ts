import { z } from "zod";
import { openAiClient } from "@/lib/llm";
import { tavilyProvider } from "@/lib/search";
import { fetchDirectory } from "@/lib/pipeline/composio";
import { runPipeline } from "@/lib/pipeline";
import { InputError, guessSlug, validateInput } from "@/lib/pipeline/resolve";
import { getAnyGuide, getGuide } from "@/lib/guides";
import { getStore } from "@/lib/store";
import { checkLimits } from "@/lib/ratelimit";
import type { PipelineEvent } from "@/lib/pipeline/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({ query: z.string(), force: z.boolean().optional() });
const FAST_BUDGET_MS = 170_000; // target 120 s; stages after this are skipped, platform limit is 300 s

const json = (status: number, error: string) => Response.json({ error }, { status });
const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const headers = { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" };

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, "Send JSON like {\"query\": \"Zoom\"}.");
  let input;
  try {
    input = validateInput(parsed.data.query);
  } catch (e) {
    return json(400, e instanceof InputError ? e.message : "Invalid input.");
  }
  const force = parsed.data.force === true;
  const models = { fast: process.env.MODEL_FAST ?? "", deep: process.env.MODEL_DEEP ?? "" };
  if (!models.fast || !process.env.FASTROUTER_API_KEY || !process.env.TAVILY_API_KEY) return json(503, "Live generation is not configured on this server.");

  // Cache: a complete guide for the same slug costs nothing and bypasses the rate limit (spec 8).
  if (!force) {
    const hit = await getAnyGuide(guessSlug(input));
    if (hit?.complete) return new Response(sse("complete", { slug: hit.slug, cached: true }), { headers });
  }

  const limit = await checkLimits(clientIp(req)).catch(() => ({ ok: true as const })); // fail open on counter outage; the daily cap still bounds nothing then, so keep keys server-side only
  if (!limit.ok) return json(limit.status, limit.message);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(enc.encode(sse(event, data)));
        } catch {
          /* client went away */
        }
      };
      const beat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": heartbeat\n\n"));
        } catch {
          /* closed */
        }
      }, 15_000);
      try {
        const store = getStore();
        const r = await runPipeline({
          query: input.value,
          mode: "fast",
          models,
          deps: { llm: openAiClient(), search: tavilyProvider(), composio: () => fetchDirectory(), now: () => new Date() },
          cacheLookup: force ? undefined : async (slug) => {
            const g = await getAnyGuide(slug);
            return g?.complete ? g : null;
          },
          ctx: { deadline: Date.now() + FAST_BUDGET_MS, emit: (e: PipelineEvent) => { if (e.type !== "complete") send(e.type, e); } },
        });
        if (!r.guide) {
          send("error", { message: "We could not build a guide for that. Try the app's official name or website." });
        } else {
          if (!r.cached && !getGuide(r.guide.slug)) await store.put(r.guide); // never overwrite a library guide
          send("complete", { slug: r.guide.slug, complete: r.guide.complete, cached: r.cached === true });
        }
      } catch (e) {
        send("error", { message: e instanceof InputError ? e.message : "Something went wrong while generating. Please try again." });
      } finally {
        clearInterval(beat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
  return new Response(stream, { headers });
}
