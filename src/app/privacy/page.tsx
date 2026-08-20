import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPolicyContent } from "@/components/legal/LegalDocumentContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

/** Legal copy loaded from message files; Spanish requires separate legal review before shipping. */
export default function PrivacyPage() {
  return <PrivacyPolicyContent />;
}
