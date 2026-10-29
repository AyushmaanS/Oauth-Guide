import OpenAI from "openai";
import type { z } from "zod";

/** Minimal seam so the pipeline can be tested with a mock (spec 6: single constrained calls). */
export interface LlmClient {
  complete(args: { model: string; system: string; user: string; maxTokens: number; timeoutMs: number }): Promise<string>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function openAiClient(): LlmClient {
  const apiKey = process.env.FASTROUTER_API_KEY;
  if (!apiKey) throw new Error("FASTROUTER_API_KEY is not set");
  const client = new OpenAI({ apiKey, baseURL: process.env.FASTROUTER_BASE_URL || "https://go.fastrouter.ai/api/v1" });
  return {
    async complete({ model, system, user, maxTokens, timeoutMs }) {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await client.chat.completions.create(
            {
              model,
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              response_format: { type: "json_object" },
              max_tokens: maxTokens,
            },
            { timeout: timeoutMs },
          );
          const text = res.choices[0]?.message?.content ?? "";
          if (!text.trim()) throw Object.assign(new Error("empty model output"), { retryable: true });
          return text;
        } catch (e) {
          lastErr = e;
          const status = (e as { status?: number }).status;
          const retryable = status === 429 || (status !== undefined && status >= 500) || (e as { retryable?: boolean }).retryable;
          if (!retryable || attempt === 2) break;
          await sleep(800 * 2 ** attempt + Math.random() * 400);
        }
      }
      // Never include request details (could carry keys); message only.
      throw new Error(`LLM call failed: ${String((lastErr as Error)?.message ?? lastErr).slice(0, 200)}`);
    },
  };
}

/** Parse model text as JSON, tolerating code fences or surrounding prose. */
export function extractJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const attempt = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      // Models sometimes emit JavaScript-isms such as `"x": undefined`; treat as absent.
      const cleaned = s.replace(/:\s*undefined\b/g, ": null");
      try {
        return prune(JSON.parse(cleaned));
      } catch {
        return prune(JSON.parse(repairJson(cleaned)));
      }
    }
  };
  try {
    return attempt(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return attempt(t.slice(a, b + 1));
    throw new Error("not valid JSON");
  }
}

/** Best-effort repair of near-valid JSON: trailing commas, and a truncated tail (close open strings, arrays, objects). */
export function repairJson(text: string): string {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  let out = "";
  for (const ch of text) {
    out += ch;
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inStr) out += '"';
  const hadColon = /:\s*$/.test(out);
  out = out.replace(/[,:\s]+$/, "");
  // A key left without a value (truncated right after `"key":`) is dropped when the open container is an object.
  if (hadColon && stack[stack.length - 1] === "}") out = out.replace(/,?\s*"(?:[^"\\]|\\.)*"\s*$/, "");
  out = out.replace(/,\s*([}\]])/g, "$1");
  return out + stack.reverse().join("");
}

/** Remove null-valued keys (our schemas use optional fields, never null). */
function prune(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(prune);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== null).map(([k, x]) => [k, prune(x)]));
  return v;
}

export interface JsonCallArgs<T> {
  llm: LlmClient;
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  timeoutMs?: number;
  /** One repair retry feeding the validation errors back (spec 6.1). */
  repair?: boolean;
  /** Total attempts when repair is on (default 2). Large structured outputs may use 3. */
  attempts?: number;
}

/** Single constrained LLM call returning zod-validated JSON. */
export async function callJson<T>(a: JsonCallArgs<T>): Promise<T> {
  const base = { model: a.model, system: a.system, maxTokens: a.maxTokens ?? 4000, timeoutMs: a.timeoutMs ?? 60000 };
  let user = a.user;
  let lastError = "";
  for (let attempt = 0; attempt < (a.repair === false ? 1 : (a.attempts ?? 2)); attempt++) {
    const text = await a.llm.complete({ ...base, user });
    try {
      const parsed = a.schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch (e) {
      lastError = (e as Error).message;
    }
    user = `${a.user}\n\nYour previous reply was rejected: ${lastError}\nReturn corrected JSON only.`;
  }
  throw new Error(`Model output failed validation: ${lastError}`);
}
