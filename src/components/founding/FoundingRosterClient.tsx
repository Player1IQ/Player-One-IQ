"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

const perks = [
  {
    num: "01",
    title: "12 months of Player One IQ Pro",
    body: "Founding Creators receive complimentary Pro access during pre-launch plus 12 months beginning at public launch.",
  },
  {
    num: "02",
    title: "Permanent founding status",
    body: "Your account will permanently show that you were part of the group that helped shape Player One IQ before launch.",
    badge: "P1 // FOUNDING",
  },
  {
    num: "03",
    title: "Direct founder access",
    body: "Direct access to the team building Player One IQ for feedback, ideas, bugs, and product conversations.",
  },
  {
    num: "04",
    title: "Product influence",
    body: "Help determine what we build next, test new functionality early, and tell us what creators actually need.",
  },
  {
    num: "05",
    title: "Early feature access",
    body: "Founding members get first access to new functionality as the Player One IQ ecosystem expands.",
  },
  {
    num: "06",
    title: "Founding creator spotlights",
    body: "Selected members may be featured across Player One IQ social channels and community. Participation is optional.",
  },
];

const signals = [
  "Consistently creating or streaming",
  "Building across multiple platforms",
  "Monetizing or working toward monetization",
  "Treating content like a business",
  "Working with brands, teams, editors, or collaborators",
  "Willing to actively use Player One IQ and give candid feedback",
];

const orgBenefits = [
  "Complimentary pre-launch access",
  "12 months of Organization Pro beginning at public launch",
  "Up to 5 initial creator seats",
  "White-glove onboarding",
  "Direct founder access",
  "Early organization features",
  "Permanent Founding Organization status",
];

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

export function FoundingRosterClient() {
  const [submitted, setSubmitted] = useState(false);
  const [applicantType, setApplicantType] =
    useState<FoundingApplicantType>("creator");
  const viewed = useRef(false);

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
              Application received
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              You&apos;re on our radar.
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-4">
              We&apos;re keeping Cohort 01 intentionally small so we can work closely
              with every member.
            </p>
            <p className="text-white/50 text-lg leading-relaxed mb-4">
              Your application has been received and will be personally reviewed.
              If there&apos;s a fit, we&apos;ll reach out with next steps.
            </p>
            <p className="font-display text-2xl font-bold text-white mt-10 mb-10">
              Keep building.
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
                Follow the journey
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
                Explore Player One IQ
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

      {/* Hero */}
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
            Player One IQ
          </motion.p>
          <motion.h1
            className="font-display text-[3.5rem] md:text-[5.5rem] font-extrabold text-white leading-[0.98] tracking-[-0.03em] mb-6"
            {...fadeUp}
          >
            The Founding Roster
          </motion.h1>
          <motion.p
            className="font-display text-xl md:text-2xl text-white/70 mb-6"
            {...fadeUp}
          >
            For the ones building what&apos;s next.
          </motion.p>
          <motion.p
            className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed mb-12"
            {...fadeUp}
          >
            Player One IQ is selecting its first group of creators and organizations
            to help shape the platform before public launch.
          </motion.p>
          <motion.div
            className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto mb-12"
            {...fadeUp}
          >
            {[
              { value: "25", label: "Creators" },
              { value: "5", label: "Organizations" },
              { value: "01", label: "First cohort" },
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
              Apply to Cohort 01
            </button>
            <a
              href="#founding-perks"
              className="px-8 py-4 rounded-xl text-sm font-semibold text-white/75 border border-white/12 hover:border-white/25 transition-colors"
            >
              See what founding members get
            </a>
          </motion.div>
        </div>
      </section>

      {/* Thesis */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Gaming became a career.
              <br />
              <span className="text-white/45">
                The infrastructure behind it didn&apos;t.
              </span>
            </h2>
          </motion.div>
          <motion.div className="space-y-5 text-white/50 text-lg leading-relaxed" {...fadeUp}>
            <p>
              Creators are building audiences, businesses, teams, partnerships, and
              careers across platforms that were never designed to work together.
            </p>
            <p>
              Player One IQ is building the operating system for the professional
              creator economy, starting with gaming.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who we're looking for */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div className="max-w-3xl mb-14" {...fadeUp}>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              We&apos;re not looking for the biggest creators.
            </h2>
            <p className="font-display text-2xl text-violet-300/90 mb-6">
              We&apos;re looking for the ones serious about becoming them.
            </p>
            <p className="text-white/45 text-lg leading-relaxed">
              Follower count isn&apos;t what gets you into the Founding Roster. We&apos;re
              looking for creators who are actively building, consistently creating,
              and serious about turning content into a career.
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

      {/* Perks */}
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
            Founding has its perks.
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

      {/* Nominations */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl font-extrabold text-white mb-6">
              Build the roster with us.
            </h2>
            <p className="text-white/45 text-lg leading-relaxed mb-6">
              Activated Founding Creators unlock two nominations for creators they
              believe belong in the Founding Roster.
            </p>
            <div className="font-display text-5xl font-extrabold text-violet-300 mb-4">
              2 nominations
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              A nomination does not guarantee acceptance. Every member of the Founding
              Roster is reviewed by Player One IQ.
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
              Sample nomination
            </p>
            <p className="font-display text-xl font-bold text-white leading-snug">
              You&apos;ve been nominated for the Player One IQ Founding Roster.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Builders */}
      <section className="py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="font-display text-4xl md:text-6xl font-extrabold text-white mb-4"
            {...fadeUp}
          >
            We don&apos;t need promoters.
          </motion.h2>
          <motion.p
            className="font-display text-3xl md:text-4xl font-bold text-violet-300 mb-10"
            {...fadeUp}
          >
            We need builders.
          </motion.p>
          <motion.div className="space-y-3 text-white/45 text-lg mb-14" {...fadeUp}>
            <p>We don&apos;t expect you to post about Player One IQ.</p>
            <p>We don&apos;t require testimonials.</p>
            <p>We don&apos;t need you to pretend everything is perfect.</p>
          </motion.div>
          <motion.div
            className="space-y-2 font-display text-lg md:text-2xl font-bold uppercase tracking-wide text-white"
            {...fadeUp}
          >
            <p>Use it.</p>
            <p>Break it.</p>
            <p>Tell us what&apos;s missing.</p>
            <p className="text-violet-300 pt-4">
              Help us build something creators actually want.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Organizations */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div className="max-w-3xl mb-10" {...fadeUp}>
            <h2 className="font-display text-4xl font-extrabold text-white mb-4">
              Building a team?
            </h2>
            <p className="text-white/45 text-lg leading-relaxed">
              We&apos;re also selecting five Founding Organizations to help shape the
              organization side of Player One IQ.
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
            Apply as an organization
          </button>
        </div>
      </section>

      {/* Application */}
      <section
        id="apply"
        className="py-24 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div className="mb-12" {...fadeUp}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400 mb-4">
              Cohort 01 application
            </p>
            <h2 className="font-display text-4xl font-extrabold text-white">
              Apply to the Founding Roster
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
