import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMediaKit } from "@/components/media-kit/PublicMediaKit";
import { loadEnabledMediaKitByToken } from "@/lib/media-kit/store";
import { isMediaKitToken } from "@/lib/media-kit/token";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface KitPageProps {
  params: Promise<{ token: string }>;
}

async function loadPublicKit(token: string) {
  if (!isMediaKitToken(token)) return null;
  const supabase = createServiceClient();
  if (!supabase) return null;
  const kit = await loadEnabledMediaKitByToken(supabase, token);
  if (!kit?.enabled || !kit.snapshot) return null;
  return kit;
}

export async function generateMetadata({
  params,
}: KitPageProps): Promise<Metadata> {
  const { token } = await params;
  const kit = await loadPublicKit(token);
  const name = kit?.snapshot?.name;
  return {
    title: name ? `${name} · Media kit` : "Media kit",
    description: kit?.snapshot?.kitBio?.trim() || undefined,
    robots: { index: false, follow: false },
  };
}

export default async function PublicMediaKitPage({ params }: KitPageProps) {
  const { token } = await params;
  const kit = await loadPublicKit(token);
  if (!kit) notFound();
  return <PublicMediaKit kit={kit} />;
}
