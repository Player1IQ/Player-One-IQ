import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { defaultLocale, isAppLocale } from "@/i18n/config";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PRODUCT_NAME,
  LEGAL_WEBSITE_URL,
} from "@/lib/legal/constants";

type LabeledItem = { label: string; text: string };
type LegalSectionData = {
  title: string;
  paragraphs?: string[];
  labeled?: LabeledItem[];
  listIntro?: string;
  list?: string[];
  listOutro?: string;
};

const LEGAL_VARS = {
  companyName: LEGAL_COMPANY_NAME,
  productName: LEGAL_PRODUCT_NAME,
  websiteUrl: LEGAL_WEBSITE_URL,
  email: LEGAL_CONTACT_EMAIL,
};

function interpolate(text: string): string {
  return text
    .replaceAll("{companyName}", LEGAL_COMPANY_NAME)
    .replaceAll("{productName}", LEGAL_PRODUCT_NAME)
    .replaceAll("{websiteUrl}", LEGAL_WEBSITE_URL)
    .replaceAll("{email}", LEGAL_CONTACT_EMAIL);
}

function renderSection(section: LegalSectionData): ReactNode {
  return (
    <LegalSection title={interpolate(section.title)}>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{interpolate(paragraph)}</p>
      ))}
      {section.labeled?.map((item) => (
        <p key={item.label}>
          <strong className="text-white">{interpolate(item.label)}</strong>{" "}
          {interpolate(item.text)}
        </p>
      ))}
      {section.listIntro ? <p>{interpolate(section.listIntro)}</p> : null}
      {section.list ? (
        <ul className="list-disc space-y-2 pl-5">
          {section.list.map((item) => (
            <li key={item.slice(0, 40)}>{interpolate(item)}</li>
          ))}
        </ul>
      ) : null}
      {section.listOutro ? <p>{interpolate(section.listOutro)}</p> : null}
    </LegalSection>
  );
}

async function renderLegalDocument(documentKey: "privacy" | "terms") {
  const t = await getTranslations(`legal.${documentKey}`);
  const sectionOrder = t.raw("sectionOrder") as string[];
  const sections = t.raw("sections") as Record<string, LegalSectionData>;

  return (
    <>
      {sectionOrder.map((id) => {
        const section = sections[id];
        if (!section) return null;
        return <div key={id}>{renderSection(section)}</div>;
      })}
    </>
  );
}

async function getDraftTranslationNotice(): Promise<string | undefined> {
  const resolvedLocale = await getLocale();
  const locale = isAppLocale(resolvedLocale) ? resolvedLocale : defaultLocale;
  if (locale !== "es") return undefined;

  const t = await getTranslations("legal");
  const notice = t("draftTranslationNotice").trim();
  return notice.length > 0 ? notice : undefined;
}

/** Legal copy is loaded from message files — Spanish requires separate legal review before shipping. */
export async function PrivacyPolicyContent() {
  const t = await getTranslations("legal.privacy");
  return (
    <LegalPageLayout
      title={t("title")}
      draftTranslationNotice={await getDraftTranslationNotice()}
    >
      {await renderLegalDocument("privacy")}
    </LegalPageLayout>
  );
}

/** Legal copy is loaded from message files — Spanish requires separate legal review before shipping. */
export async function TermsOfServiceContent() {
  const t = await getTranslations("legal.terms");
  return (
    <LegalPageLayout
      title={t("title")}
      draftTranslationNotice={await getDraftTranslationNotice()}
    >
      {await renderLegalDocument("terms")}
    </LegalPageLayout>
  );
}

export { LEGAL_VARS };
