import fs from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { Guide } from "@/lib/schema/guide";

/** Persistence for live guides. Reads are re-validated: the store is not trusted. */
export interface Store {
  get(slug: string): Promise<Guide | null>;
  put(guide: Guide): Promise<void>;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function fsStore(dir = path.join(process.cwd(), ".data", "live")): Store {
  return {
    async get(slug) {
      if (!SLUG.test(slug)) return null;
      try {
        const parsed = Guide.safeParse(JSON.parse(await fs.readFile(path.join(dir, `${slug}.json`), "utf8")));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    async put(guide) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, `${guide.slug}.json`), JSON.stringify(guide));
    },
  };
}

/** Env names differ by how the Redis store was added; accept both (VERIFY in Sprint 7). */
export function redisFromEnv(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Redis store is not configured (missing REST URL/token)");
  return new Redis({ url, token });
}

export function redisStore(redis: Pick<Redis, "get" | "set"> = redisFromEnv()): Store {
  return {
    async get(slug) {
      if (!SLUG.test(slug)) return null;
      const raw = await redis.get<unknown>(`guide:${slug}`);
      const parsed = Guide.safeParse(typeof raw === "string" ? JSON.parse(raw) : raw);
      return parsed.success ? parsed.data : null;
    },
    async put(guide) {
      await redis.set(`guide:${guide.slug}`, JSON.stringify(guide));
    },
  };
}

let cached: Store | undefined;
export function getStore(): Store {
  return (cached ??= process.env.STORE_DRIVER === "remote" ? redisStore() : fsStore());
}
