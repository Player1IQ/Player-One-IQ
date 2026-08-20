"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { FoundingApplicationForm } from "@/components/founding/FoundingApplicationForm";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import type { FoundingApplicantType } from "@/lib/founding/types";
import { trackMarketingEvent } from "@/lib/marketing/analytics";
import { FOUNDING_ROSTER_PATH, SOCIAL_X_URL } from "@/lib/marketing/config";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
};

function scrollToApply(type?: FoundingApplicantType) {
  if (type) {
    window.dispatchEvent(
      new CustomEvent("p1iq:founding-applicant-type", { detail: type })
    );
  }
  document.getElementById("founding-application")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

type FoundingPerk = {
  num: string;
  title: string;
  body: string;
  badge?: string;
};

export function FoundingRosterClient() {
  const t = useTranslations("founding");
  const [submitted, setSubmitted] = useState(false);
  const [applicantType, setApplicantType] =
    useState<FoundingApplicantType>("creator");
  const viewed = useRef(false);

  const perks = t.raw("perks.items") as FoundingPerk[];
  const signals = t.raw("lookingFor.signals") as string[];
  const orgBenefits = t.raw("organizations.benefits") as string[];
  const builderLines = t.raw("builders.lines") as string[];
  const builderCalls = t.raw("builders.calls") as string[];

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackMarketingEvent("founding_page_view");
  }, []);

  useEffect(() => {
    function onType(event: Event) {
      const detail = (event as CustomEvent<FoundingApplicantType>).detail;
      if (detail === "creator" || detail === "organization") {
        setApplicantType(detail);
      }
    }
    window.addEventListener("p1iq:founding-applicant-type", onType);
    return () => window.removeEventListener("p1iq:founding-applicant-type", onType);
  }, []);

  if (submitted) {
    return (
      <div
        className="marketing-landing min-h-screen overflow-x-hidden"
        style={{ background: "#06060f", color: "#f1f5f9" }}
      >
        <MarketingNav activePath={FOUNDING_ROSTER_PATH} />
        <section className="min-h-screen flex items-center justify-center px-6 pt-28 pb-24">
          <div className="max-w-2xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400 mb-6">
              {t("submitted.eyebrow")}
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              {t("submitted.title")}
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-4">
              {t("submitted.p1")}
            </p>
            <p className="text-white/50 text-lg leading-relaxed mb-4">
              {t("submitted.p2")}
            </p>
            <p className="font-display text-2xl font-bold text-white mt-10 mb-10">
              {t("submitted.closing")}
            </p>
            {SOCIAL_X_URL ? (
              <a
                href={SOCIAL_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                }}
              >
                {t("submitted.followJourney")}
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                }}
              >
                {t("submitted.explore")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div
      className="marketing-landing min-h-screen overflow-x-hidden"
      style={{ background: "#06060f", color: "#f1f5f9" }}
    >
      <MarketingNav activePath={FOUNDING_ROSTER_PATH} />

      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 55%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.p
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-400 mb-6"
            {...fadeUp}
          >
            {t("brand")}
          </motion.p>
          <motion.h1
            className="font-display text-[3.5rem] md:text-[5.5rem] font-extrabold text-white leading-[0.98] tracking-[-0.03em] mb-6"
            {...fadeUp}
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            className="font-display text-xl md:text-2xl text-white/70 mb-6"
            {...fadeUp}
          >
            {t("hero.subtitle")}
          </motion.p>
          <motion.p
            className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed mb-12"
            {...fadeUp}
          >
            {t("hero.description")}
          </motion.p>
          <motion.div
            className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto mb-12"
            {...fadeUp}
          >
            {[
              { value: "25", label: t("hero.stats.creators") },
              { value: "5", label: t("hero.stats.organizations") },
              { value: "30", label: t("hero.stats.total") },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl px-6 py-5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="font-display text-4xl font-extrabold text-white">
                  {item.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/35 mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            {...fadeUp}
          >
            <button
              type="button"
              onClick={() => {
                trackMarketingEvent("founding_apply_clicked");
                scrollToApply("creator");
              }}
              className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
              }}
            >
              {t("hero.apply")}
            </button>
            <a
              href="#founding-perks"
              className="px-8 py-4 rounded-xl text-sm font-semibold text-white/75 border border-white/12 hover:border-white/25 transition-colors"
            >
              {t("hero.seePerks")}
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {t("thesis.title")}
              <br />
              <span className="text-white/45">{t("thesis.titleMuted")}</span>
            </h2>
          </motion.div>
          <motion.div className="space-y-5 text-white/50 text-lg leading-relaxed" {...fadeUp}>
            <p>{t("thesis.p1")}</p>
            <p>{t("thesis.p2")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div className="max-w-3xl mb-14" {...fadeUp}>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              {t("lookingFor.title")}
            </h2>
            <p className="font-display text-2xl text-violet-300/90 mb-6">
              {t("lookingFor.subtitle")}
            </p>
            <p className="text-white/45 text-lg leading-relaxed">
              {t("lookingFor.description")}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {signals.map((signal, i) => (
              <motion.div
                key={signal}
                className="rounded-2xl px-5 py-4 text-sm text-white/65"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {signal}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="founding-perks"
        className="py-24 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="font-display text-4xl md:text-5xl font-extrabold text-white mb-14"
            {...fadeUp}
          >
            {t("perks.title")}
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-5">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.num}
                className="rounded-2xl p-7"
                style={{
                  background: "rgba(255,255,255,0.022)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="text-violet-400 text-xs font-bold tracking-widest mb-3">
                  {perk.num}
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">
                  {perk.title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">{perk.body}</p>
                {perk.badge ? (
                  <div
                    className="mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-violet-300"
                    style={{
                      border: "1px solid rgba(124,58,237,0.35)",
                      background: "rgba(124,58,237,0.1)",
                    }}
                  >
                    {perk.badge}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl font-extrabold text-white mb-6">
              {t("nominations.title")}
            </h2>
            <p className="text-white/45 text-lg leading-relaxed mb-6">
              {t("nominations.description")}
            </p>
            <div className="font-display text-5xl font-extrabold text-violet-300 mb-4">
              {t("nominations.count")}
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              {t("nominations.disclaimer")}
            </p>
          </motion.div>
          <motion.div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.18)",
            }}
            {...fadeUp}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400 mb-4">
              {t("nominations.sampleLabel")}
            </p>
            <p className="font-display text-xl font-bold text-white leading-snug">
              {t("nominations.sampleText")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="font-display text-4xl md:text-6xl font-extrabold text-white mb-4"
            {...fadeUp}
          >
            {t("builders.title")}
          </motion.h2>
          <motion.p
            className="font-display text-3xl md:text-4xl font-bold text-violet-300 mb-10"
            {...fadeUp}
          >
            {t("builders.subtitle")}
          </motion.p>
          <motion.div className="space-y-3 text-white/45 text-lg mb-14" {...fadeUp}>
            {builderLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </motion.div>
          <motion.div
            className="space-y-2 font-display text-lg md:text-2xl font-bold uppercase tracking-wide text-white"
            {...fadeUp}
          >
            {builderCalls.map((call) => (
              <p key={call}>{call}</p>
            ))}
            <p className="text-violet-300 pt-4">{t("builders.closing")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div className="max-w-3xl mb-10" {...fadeUp}>
            <h2 className="font-display text-4xl font-extrabold text-white mb-4">
              {t("organizations.title")}
            </h2>
            <p className="text-white/45 text-lg leading-relaxed">
              {t("organizations.description")}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {orgBenefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-white/60"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <ChevronRight className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollToApply("organization")}
            className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            {t("organizations.apply")}
          </button>
        </div>
      </section>

      <section
        id="apply"
        className="py-24 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div className="mb-12" {...fadeUp}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400 mb-4">
              {t("application.eyebrow")}
            </p>
            <h2 className="font-display text-4xl font-extrabold text-white">
              {t("application.title")}
            </h2>
          </motion.div>
          <motion.div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            {...fadeUp}
          >
            <FoundingApplicationForm
              initialApplicantType={applicantType}
              onSuccess={() => setSubmitted(true)}
            />
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
