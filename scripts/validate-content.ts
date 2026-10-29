/** Fails (exit 1) if any content/guides/*.json is invalid. Runs before `next build`. */
import fs from "node:fs";
import path from "node:path";
import { Guide } from "../src/lib/schema/guide";

const dir = path.join("content", "guides");
let bad = 0;
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".json")) : []) {
  const r = Guide.safeParse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  if (!r.success) {
    bad++;
    console.error(`Invalid guide ${f}:`);
    r.error.issues.slice(0, 5).forEach((i) => console.error(`  ${i.path.join(".")}: ${i.message}`));
  } else console.log(`ok ${f}`);
}
process.exit(bad ? 1 : 0);
