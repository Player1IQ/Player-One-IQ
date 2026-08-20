import Link from "next/link";
import type { ReactNode } from "react";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_PRODUCT_NAME,
} from "@/lib/legal/constants";

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
  draftTranslationNotice?: string;
}

export function LegalPageLayout({
  title,
  children,
  draftTranslationNotice,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-gray-200">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-accent-light hover:underline">
          ← {LEGAL_PRODUCT_NAME}
        </Link>
        {draftTranslationNotice ? (
          <p
            className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            {draftTranslationNotice}
          </p>
        ) : null}
        <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LEGAL_LAST_UPDATED}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-300">
          {children}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-sm text-gray-500">
          Questions about this page? Contact{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-accent-light hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . {LEGAL_COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
