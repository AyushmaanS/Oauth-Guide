import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideView } from "@/components/GuideView";
import { getAnyGuide } from "@/lib/guides";

// Library guides are validated at build time by scripts/validate-content.ts (prebuild); live guides come from the store.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = await getAnyGuide(slug);
  return { title: g ? `${g.appName} OAuth guide` : "Guide not found" };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getAnyGuide(slug);
  if (!guide) notFound();
  return <GuideView guide={guide} />;
}
