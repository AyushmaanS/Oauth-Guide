import fs from "node:fs";
import path from "node:path";
import { Guide } from "@/lib/schema/guide";
import { getStore } from "@/lib/store";

const GUIDE_DIR = path.join(process.cwd(), "content", "guides");
const FIXTURE = path.join(process.cwd(), "src", "fixtures", "sample-guide.json");

/** The fake fixture is shown in development only, or when SHOW_FIXTURE=1. */
const showFixture = () => process.env.NODE_ENV !== "production" || process.env.SHOW_FIXTURE === "1";

function parseFile(file: string): Guide {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const result = Guide.safeParse(raw);
  if (!result.success) {
    const msgs = result.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
    // A bad library guide must fail the build, not render something misleading.
    throw new Error(`Invalid guide ${path.basename(file)}:\n${msgs.join("\n")}`);
  }
  return result.data;
}

export function getLibraryGuides(): Guide[] {
  const files = fs.existsSync(GUIDE_DIR) ? fs.readdirSync(GUIDE_DIR).filter((f) => f.endsWith(".json")) : [];
  const guides = files.map((f) => parseFile(path.join(GUIDE_DIR, f)));
  if (showFixture()) guides.push(parseFile(FIXTURE));
  return guides.sort((a, b) => a.appName.localeCompare(b.appName));
}

export function getGuide(slug: string): Guide | undefined {
  return getLibraryGuides().find((g) => g.slug === slug);
}

/** Library first, then the live store. Returns undefined when neither has it. */
export async function getAnyGuide(slug: string): Promise<Guide | undefined> {
  const lib = getGuide(slug);
  if (lib) return lib;
  return (await getStore().get(slug).catch(() => null)) ?? undefined;
}
