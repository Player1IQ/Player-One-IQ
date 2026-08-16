import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand/BrandLogo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.welcome");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function WelcomePage() {
  const t = await getTranslations("onboarding.welcome");

  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-gray-200">
      <div className="mx-auto max-w-2xl text-center">
        <BrandLogo size="xl" className="mx-auto" />
        <p className="mt-6 text-lg text-gray-400">{t("tagline")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-border px-6 py-2.5 text-sm text-gray-200"
          >
            {t("createAccount")}
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="hover:text-gray-300">
            {t("privacy")}
          </Link>
        </div>
      </div>
    </div>
  );
}
