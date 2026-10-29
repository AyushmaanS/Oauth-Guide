import { redisFromEnv } from "@/lib/store";

/** Atomic counter with expiry. Memory for local dev; Redis when STORE_DRIVER=remote (serverless has no shared memory). */
export interface Counter {
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export function memoryCounter(): Counter {
  const m = new Map<string, { n: number; exp: number }>();
  return {
    async incr(key, ttl) {
      const now = Date.now();
      const e = m.get(key);
      if (!e || e.exp < now) {
        m.set(key, { n: 1, exp: now + ttl * 1000 });
        return 1;
      }
      return ++e.n;
    },
  };
}

export function redisCounter(): Counter {
  const r = redisFromEnv();
  return {
    async incr(key, ttl) {
      const n = await r.incr(key);
      if (n === 1) await r.expire(key, ttl);
      return n;
    },
  };
}

let counter: Counter | undefined;
export const getCounter = (): Counter => (counter ??= process.env.STORE_DRIVER === "remote" ? redisCounter() : memoryCounter());

export type LimitResult = { ok: true } | { ok: false; status: 429 | 503; message: string };

/** Per-IP hourly limit, then global daily cap. Only called for runs that will cost money (not cache hits). */
export async function checkLimits(ip: string, c: Counter = getCounter(), now = new Date()): Promise<LimitResult> {
  const perHour = Number(process.env.RATE_LIMIT_PER_HOUR) || 10;
  const perDay = Number(process.env.DAILY_GENERATION_CAP) || 100;
  const iso = now.toISOString();
  const hourKey = `rl:${ip}:${iso.slice(0, 13)}`;
  const dayKey = `cap:${iso.slice(0, 10)}`;
  if ((await c.incr(hourKey, 3600)) > perHour) return { ok: false, status: 429, message: `Too many generations from your address. Try again in an hour (limit ${perHour} per hour).` };
  if ((await c.incr(dayKey, 86400)) > perDay) return { ok: false, status: 503, message: "The daily generation limit has been reached. Try a library guide, or come back tomorrow." };
  return { ok: true };
}
