"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { ReactNode, CSSProperties } from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  Users, TrendingUp, FileText, ShoppingBag, Brain, BarChart2,
  MessageSquare, Bell, Zap, DollarSign, Sparkles, ArrowRight,
  Check, Star, Globe, Activity, Twitter, Linkedin, Play,
  ChevronRight, Target, Hash, Menu, X, Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "AI", href: "#ai" },
  { label: "Marketplace", href: "#marketplace" },
];

const MOBILE_NAV_ITEMS = [
  ...NAV_ITEMS,
  { label: "Sign in", href: "/login" },
];

const revenueData = [
  { month: "Jan", revenue: 8, deals: 2 },
  { month: "Feb", revenue: 11, deals: 3 },
  { month: "Mar", revenue: 10, deals: 2 },
  { month: "Apr", revenue: 14, deals: 4 },
  { month: "May", revenue: 16, deals: 4 },
  { month: "Jun", revenue: 15, deals: 3 },
  { month: "Jul", revenue: 18, deals: 5 },
  { month: "Aug", revenue: 22, deals: 5 },
];

const creatorGrowthData = [
  { month: "Jan", creators: 4 },
  { month: "Feb", creators: 6 },
  { month: "Mar", creators: 7 },
  { month: "Apr", creators: 9 },
  { month: "May", creators: 11 },
  { month: "Jun", creators: 13 },
  { month: "Jul", creators: 15 },
  { month: "Aug", creators: 18 },
];

const heroMiniData = [
  { v: 32 }, { v: 41 }, { v: 38 }, { v: 52 },
  { v: 61 }, { v: 59 }, { v: 72 }, { v: 85 },
];

const betaPartnerOrgs = [
  "Meridian Talent", "Northline Collective", "Vertex Creator Co.", "Arcade Lane Media",
  "Summit Roster", "Forge Entertainment", "Prism Talent Group", "Lumen Creator Studio",
  "Pitchline Partners", "Baseline Sports Media", "Draft Day Management", "Halo Point Agency",
];

const sampleOpportunities = [
  { brand: "Bolt Energy", creator: "JaydenStreams", value: "Campaign", category: "Sponsorship", match: 92, status: "Active" as const },
  { brand: "Kova Apparel", creator: "MiaCreates", value: "Partnership", category: "Endorsement", match: 89, status: "Active" as const },
  { brand: "Orbit Games", creator: "TylerPlays", value: "In pipeline", category: "Partnership", match: 91, status: "Pending" as const },
  { brand: "Nimbus Tech", creator: "AlexReviews", value: "Campaign", category: "Sponsorship", match: 88, status: "Active" as const },
  { brand: "Drift Beverage", creator: "SamNova", value: "In pipeline", category: "Brand deal", match: 90, status: "Pending" as const },
];

const features = [
  {
    icon: Users,
    title: "Creator Management",
    description: "Manage your entire roster with rich creator profiles, performance tracking, and relationship intelligence. Every deal, note, and interaction — organized in one place.",
    large: true,
    color: "violet",
  },
  {
    icon: DollarSign,
    title: "Sponsor CRM",
    description: "Track every brand relationship, pitch status, and renewal pipeline from one intelligent workspace.",
    large: false,
    color: "blue",
  },
  {
    icon: FileText,
    title: "Contract Management",
    description: "Generate, sign, and manage contracts with built-in AI review and compliance checks.",
    large: false,
    color: "sky",
  },
  {
    icon: ShoppingBag,
    title: "Opportunity Marketplace",
    description: "Brands with active budgets are seeking creators right now. Our AI surfaces the right match automatically.",
    large: false,
    color: "purple",
  },
  {
    icon: Brain,
    title: "AI Growth Assistant",
    description: "Your always-on strategic advisor analyzes trends, identifies opportunities, and tells you exactly what to do next to grow faster.",
    large: true,
    color: "violet",
  },
  {
    icon: BarChart2,
    title: "Revenue Analytics",
    description: "Creator-level P&L, campaign attribution, and sponsor ROI so every decision is data-backed.",
    large: false,
    color: "emerald",
  },
  {
    icon: MessageSquare,
    title: "Team Collaboration",
    description: "Shared pipelines, internal notes, task assignments, and unified inboxes — built for agencies.",
    large: false,
    color: "blue",
  },
];

const aiAssistants = [
  {
    name: "Growth Coach",
    icon: TrendingUp,
    role: "Strategic Advisor",
    color: "violet",
    prompt: "What should I focus on to grow revenue this quarter?",
    response: "Your top 3 creator contracts are up for renewal in 45 days. Based on recent performance trends, I've drafted renegotiation briefs with recommended talking points — want me to send them for review?",
  },
  {
    name: "Content Strategist",
    icon: Sparkles,
    role: "Content Intelligence",
    color: "sky",
    prompt: "What content formats are performing best right now?",
    response: "Short-form reaction content is gaining traction in gaming this month. Jayden and Tyler on your roster have especially strong audience fit. I can draft a campaign brief for each — ready in a few minutes.",
  },
  {
    name: "Sponsorship Hunter",
    icon: Target,
    role: "Deal Prospector",
    color: "blue",
    prompt: "Find new brand opportunities for our gaming roster.",
    response: "Bolt Energy and Kova Apparel have active briefs matching three creators on your roster — Jayden, Mia, and Tyler. I drafted intro emails for each pairing — want me to send them for review?",
  },
  {
    name: "Revenue Optimizer",
    icon: DollarSign,
    role: "Financial Intelligence",
    color: "emerald",
    prompt: "Are we leaving money on the table with current pricing?",
    response: "A few sponsorships on your roster may be priced below comparable market rates. I pulled benchmarks from similar deals — here is a rate card you can use in your next negotiation.",
  },
];

const testimonials = [
  {
    quote: "We're in the public beta and already replaced three spreadsheets. Roster, renewals, and sponsor outreach finally live in one place — our team actually uses it every day.",
    name: "Jordan Reyes",
    role: "CEO",
    company: "Meridian Talent",
    avatar: "JR",
    stars: 5,
  },
  {
    quote: "The sponsor CRM and contract workflow feel purpose-built for creator deals. We onboarded our partnerships team in a week without a painful custom setup.",
    name: "Marcus Okonkwo",
    role: "Head of Partnerships",
    company: "Vertex Creator Co.",
    avatar: "MO",
    stars: 5,
  },
  {
    quote: "Marketplace matching surfaced two brand conversations we hadn't prioritized yet. For a lean agency, that kind of signal is exactly what we needed in beta.",
    name: "Aaliya Sharma",
    role: "Founder",
    company: "Northline Collective",
    avatar: "AS",
    stars: 5,
  },
];

const plans = [
  {
    name: "Creator",
    monthlyPrice: 29,
    annualPrice: 23,
    description: "For solo creators building their brand",
    features: ["1 creator profile", "Basic analytics dashboard", "5 active deal slots", "Contract templates", "Email support"],
    cta: "Start Free Trial",
    featured: false,
    badge: null,
  },
  {
    name: "Creator Pro",
    monthlyPrice: 79,
    annualPrice: 63,
    description: "For serious creators scaling fast",
    features: ["1 creator profile", "Advanced analytics", "Unlimited active deals", "AI Growth Assistant", "Opportunity Marketplace", "Priority support"],
    cta: "Start Free Trial",
    featured: false,
    badge: null,
  },
  {
    name: "Agency",
    monthlyPrice: 299,
    annualPrice: 239,
    description: "For boutique agencies managing creators",
    features: ["Up to 25 creators", "Team collaboration tools", "Sponsor CRM", "Contract management", "Revenue analytics", "Dedicated onboarding"],
    cta: "Start Free Trial",
    featured: false,
    badge: null,
  },
  {
    name: "Agency Pro",
    monthlyPrice: 699,
    annualPrice: 559,
    description: "The complete agency operating system",
    features: ["Up to 100 creators", "All 4 AI assistants", "Full marketplace access", "White-label reports", "Custom integrations", "SLA & dedicated CSM"],
    cta: "Start Free Trial",
    featured: true,
    badge: "Most Popular",
  },
  {
    name: "Sponsor",
    monthlyPrice: 499,
    annualPrice: 399,
    description: "For brands managing creator campaigns",
    features: ["Unlimited campaigns", "Creator discovery engine", "ROI tracking dashboard", "Contract automation", "Brand safety tools", "Campaign analytics"],
    cta: "Start Free Trial",
    featured: false,
    badge: null,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    description: "Custom solution for large organizations",
    features: ["Unlimited everything", "Custom AI model training", "Enterprise SSO", "Audit logs & compliance", "Dedicated infrastructure", "White-glove service"],
    cta: "Contact Sales",
    featured: false,
    badge: "Custom",
  },
];

const marketplaceDeals = sampleOpportunities;

// ─── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
};

function stagger(i: number) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.65, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  };
}

// ─── Icon color maps ───────────────────────────────────────────────────────────

const iconBg: Record<string, string> = {
  violet: "rgba(139, 92, 246, 0.12)",
  blue: "rgba(59, 130, 246, 0.12)",
  sky: "rgba(56, 189, 248, 0.12)",
  purple: "rgba(168, 85, 247, 0.12)",
  emerald: "rgba(16, 185, 129, 0.12)",
};
const iconText: Record<string, string> = {
  violet: "#a78bfa",
  blue: "#60a5fa",
  sky: "#38bdf8",
  purple: "#c084fc",
  emerald: "#34d399",
};

// ─── Shared components ─────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
  style = {},
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function Tag({ children, color = "violet" }: { children: ReactNode; color?: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    violet: { bg: "rgba(124,58,237,0.1)", text: "#a78bfa", border: "rgba(124,58,237,0.25)" },
    sky: { bg: "rgba(56,189,248,0.08)", text: "#38bdf8", border: "rgba(56,189,248,0.2)" },
    emerald: { bg: "rgba(16,185,129,0.08)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
  };
  const c = colors[color] || colors.violet;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {children}
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={
        scrolled
          ? {
              background: "rgba(6,6,15,0.85)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "12px 0",
            }
          : { padding: "20px 0" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-[15px] tracking-tight">
            Player One IQ
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label} href={item.href}
              className="text-sm text-white/45 hover:text-white/85 transition-colors font-medium"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:block text-sm text-white/55 hover:text-white transition-colors font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
            }}
          >
            Start Free Trial
          </Link>
          <button
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden mt-4 mx-6 rounded-2xl p-5 space-y-3"
          style={{ background: "rgba(13,13,31,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {MOBILE_NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm text-white/60 hover:text-white py-2 border-b border-white/[0.05] last:border-0 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Hero Dashboard Mockup ─────────────────────────────────────────────────────

function HeroDashboard() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,10,24,0.95)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        transform: "perspective(1400px) rotateY(-7deg) rotateX(4deg)",
        boxShadow:
          "0 80px 160px rgba(124,58,237,0.18), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-display text-xs font-semibold text-white/80">Player One IQ</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Live
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            JK
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className="w-[50px] py-4 flex flex-col items-center gap-2 flex-shrink-0"
          style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[BarChart2, Users, DollarSign, FileText, Brain, MessageSquare].map((Icon, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
              style={
                i === 1
                  ? { background: "rgba(124,58,237,0.22)", color: "#a78bfa" }
                  : { color: "rgba(255,255,255,0.2)" }
              }
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="flex-1 p-5 min-w-0">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Revenue", value: "Your data", delta: "Track MRR" },
              { label: "Deals", value: "Pipeline", delta: "All stages" },
              { label: "Brands", value: "CRM", delta: "Relationships" },
              { label: "Creators", value: "Roster", delta: "One view" },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-2.5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div className="text-[9px] text-white/35 mb-1 font-medium uppercase tracking-wide">
                  {s.label}
                </div>
                <div className="font-display text-sm font-bold text-white leading-none">
                  {s.value}
                </div>
                <div className="text-[9px] text-emerald-400 font-medium mt-1">{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div
            className="rounded-xl p-3 mb-4"
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-white/35">
                Revenue Trend
              </span>
              <span className="text-[9px] font-semibold text-violet-400">Sample view</span>
            </div>
            <div className="h-[72px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heroMiniData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#heroGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent deals */}
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mb-2">
              Recent Opportunities
            </div>
            {sampleOpportunities.slice(0, 3).map((deal, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: deal.status === "Active" ? "#34d399" : "#fbbf24" }}
                  />
                  <span className="text-[10px] text-white/60">
                    {deal.brand}{" "}
                    <span className="text-white/25">×</span>{" "}
                    {deal.creator}
                  </span>
                </div>
                <span className="font-data text-[10px] font-semibold text-white/75">
                  {deal.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purple gradient shine */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, transparent 55%)" }}
      />
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="product" className="relative min-h-screen flex items-center pt-28 pb-24 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-32 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.09) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">
          {/* Left */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 text-sm"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.28)",
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
              <span className="text-violet-400 font-medium text-xs">
                Now in public beta — built for creator agencies
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-[4rem] lg:text-[5.5rem] font-extrabold text-white leading-[1.02] tracking-[-0.03em] mb-7"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              The Operating
              <br />
              System for the
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Creator Economy.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-white/50 mb-10 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35 }}
            >
              Manage creators, sponsorships, contracts, revenue, AI insights,
              opportunities, and your entire business from one intelligent platform.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 mb-14"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.48 }}
            >
              <Link
                href="/signup"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                }}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white/75 hover:text-white transition-all duration-200 hover:border-white/20"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Play className="w-4 h-4" />
                See how it works
              </Link>
            </motion.div>

            <motion.div
              className="flex items-center gap-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.62 }}
            >
              {[
                { value: "All-in-one", label: "Creator workspace" },
                { value: "AI-powered", label: "Growth & deals" },
                { value: "Public beta", label: "Now live" },
              ].map((stat, i) => (
                <div key={i} className={i > 0 ? "border-l pl-10" : ""} style={i > 0 ? { borderColor: "rgba(255,255,255,0.08)" } : {}}>
                  <div className="font-display text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/35 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroDashboard />

            {/* Floating stat cards */}
            <motion.div
              className="absolute -left-14 top-12 rounded-2xl px-4 py-3 w-52"
              style={{
                background: "rgba(10,10,24,0.96)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.15)" }}
                >
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-[10px] text-white/50 font-medium">Deal Closed</span>
              </div>
              <div className="font-display text-sm font-bold text-white">Bolt Energy × JaydenStreams</div>
              <div className="font-data text-xs text-emerald-400 font-semibold mt-0.5">Campaign won</div>
            </motion.div>

            <motion.div
              className="absolute -right-12 top-1/3 rounded-2xl px-4 py-3 w-48"
              style={{
                background: "rgba(10,10,24,0.96)",
                border: "1px solid rgba(124,58,237,0.2)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-3 h-3 text-violet-400" />
                <span className="text-[9px] text-white/35 font-semibold uppercase tracking-wide">
                  AI Insight
                </span>
              </div>
              <div className="text-[11px] text-white/65 leading-snug">
                3 contracts up for renewal. Renegotiation briefs ready for review.
              </div>
            </motion.div>

            <motion.div
              className="absolute -left-10 bottom-14 rounded-2xl px-4 py-3 w-40"
              style={{
                background: "rgba(10,10,24,0.96)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            >
              <div className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wide">
                Sponsor ROI
              </div>
              <div className="font-display text-2xl font-bold text-white">Built-in</div>
              <div className="text-[10px] text-sky-400 font-medium mt-0.5">Per campaign</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Trusted By ────────────────────────────────────────────────────────────────

function TrustedBySection() {
  return (
    <section
      className="py-16 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/20 mb-10 px-6">
        Teams in our public beta
      </p>
      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10"
          style={{ background: "linear-gradient(to right, #06060f, transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10"
          style={{ background: "linear-gradient(to left, #06060f, transparent)" }}
        />
        <div className="flex gap-14 animate-marquee" style={{ width: "max-content" }}>
          {[...betaPartnerOrgs, ...betaPartnerOrgs].map((org, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 whitespace-nowrap select-none cursor-default"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <Hash className="w-3 h-3" />
              </div>
              <span className="text-sm font-semibold">{org}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ──────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="py-32" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-20" {...fadeUp}>
          <Tag color="violet">Platform</Tag>
          <h2 className="font-display text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Everything your creator
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              business actually needs.
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            Stop stitching together spreadsheets, email threads, and disconnected tools.
            Player One IQ is purpose-built for the creator economy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className={`group relative rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:scale-[1.015] ${
                  feat.large && i === 0 ? "lg:col-span-2" :
                  feat.large ? "lg:col-span-2" : ""
                }`}
                style={{
                  background: "rgba(255,255,255,0.022)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                {...stagger(i)}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: iconBg[feat.color], color: iconText[feat.color] }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.description}</p>
                <div className="flex items-center gap-1 mt-5 text-xs font-semibold text-white/25 group-hover:text-violet-400 transition-colors duration-200">
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.07), transparent)" }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── AI Section ────────────────────────────────────────────────────────────────

function AISection() {
  const [active, setActive] = useState(0);

  return (
    <section id="ai" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-20" {...fadeUp}>
          <Tag color="sky">AI Intelligence</Tag>
          <h2 className="font-display text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Your AI-powered team
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              never sleeps.
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Four specialized AI assistants that know your business, your creators, and the
            market — working around the clock so you don&apos;t have to.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Selector */}
          <div className="space-y-3">
            {aiAssistants.map((ai, i) => {
              const Icon = ai.icon;
              const isActive = active === i;
              return (
                <motion.button
                  key={ai.name}
                  className="w-full text-left rounded-2xl p-5 transition-all duration-300 cursor-pointer"
                  style={
                    isActive
                      ? {
                          background: "rgba(124,58,237,0.1)",
                          border: "1px solid rgba(124,58,237,0.3)",
                        }
                      : {
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                  }
                  onClick={() => setActive(i)}
                  {...stagger(i)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={
                        isActive
                          ? { background: "rgba(124,58,237,0.2)", color: "#a78bfa" }
                          : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }
                      }
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div
                        className="font-display font-bold text-sm"
                        style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.5)" }}
                      >
                        {ai.name}
                      </div>
                      <div className="text-xs text-white/25 mt-0.5">{ai.role}</div>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Preview */}
          <motion.div
            key={active}
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: "rgba(10,10,24,0.95)",
              border: "1px solid rgba(124,58,237,0.22)",
              backdropFilter: "blur(20px)",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 mb-6 pb-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
              >
                {(() => {
                  const Icon = aiAssistants[active].icon;
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <div>
                <div className="font-display font-bold text-white text-sm">
                  {aiAssistants[active].name}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{aiAssistants[active].role}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-end">
                <div
                  className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-3 text-sm text-white/80"
                  style={{
                    background: "rgba(124,58,237,0.2)",
                    border: "1px solid rgba(124,58,237,0.2)",
                  }}
                >
                  {aiAssistants[active].prompt}
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className="max-w-[90%] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-white/65 leading-relaxed"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {aiAssistants[active].response}
                </div>
              </div>
            </div>

            {/* Input */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="text-sm text-white/20 flex-1">
                Ask {aiAssistants[active].name}...
              </span>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Glow */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection() {
  return (
    <section
      className="py-32"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-20" {...fadeUp}>
          <Tag color="emerald">Analytics</Tag>
          <h2 className="font-display text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Revenue intelligence that
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #34d399, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              sees around corners.
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Real-time dashboards, creator-level P&amp;L, campaign attribution, and sponsor ROI
            — every decision backed by data you can actually trust.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: "Unified revenue", value: "One view", icon: DollarSign, delta: "All streams" },
            { label: "Creator profiles", value: "Per creator", icon: Users, delta: "P&L & metrics" },
            { label: "Campaign tracking", value: "End-to-end", icon: Activity, delta: "Pipeline to close" },
            { label: "Sponsor ROI", value: "Measurable", icon: TrendingUp, delta: "Per campaign" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.07)" }}
                {...stagger(i)}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-display text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-xs text-white/30 mb-2">{s.label}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">{s.delta}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          <motion.div
            className="rounded-2xl p-7"
            style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)" }}
            {...stagger(0)}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-base">Revenue Overview</h3>
                <p className="text-white/30 text-xs mt-0.5">Monthly revenue across all creators</p>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-white">Sample</div>
                <div className="text-xs text-emerald-400 font-semibold">Illustrative preview</div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,10,24,0.96)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${Number(v ?? 0)}`, "Sample index"]}
                    cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl p-7"
            style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)" }}
            {...stagger(1)}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-base">Creator Network Growth</h3>
                <p className="text-white/30 text-xs mt-0.5">Total managed creators over time</p>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-white">Sample</div>
                <div className="text-xs text-sky-400 font-semibold">Illustrative preview</div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creatorGrowthData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,10,24,0.96)",
                      border: "1px solid rgba(56,189,248,0.3)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v) => [Number(v ?? 0).toLocaleString(), "Creators"]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="creators" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Marketplace Section ───────────────────────────────────────────────────────

function MarketplaceSection() {
  return (
    <section
      id="marketplace"
      className="py-32"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Left */}
          <motion.div {...fadeUp}>
            <Tag color="sky">Marketplace</Tag>
            <h2 className="font-display text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              The sponsorship
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                marketplace your
                <br />
                competitors don&apos;t
                <br />
                know about.
              </span>
            </h2>
            <p className="text-white/40 text-lg mb-10 leading-relaxed">
              Brands with active budgets are searching for creators right now.
              Our AI matches them to your roster with intelligent fit scoring — and surfaces
              the opportunity before your competitors even know it exists.
            </p>
            <div className="flex gap-8">
              {[
                { value: "AI match", label: "Fit scoring" },
                { value: "Pipeline", label: "Deal stages" },
                { value: "Fast", label: "Less busywork" },
              ].map((s, i) => (
                <div
                  key={i}
                  className={i > 0 ? "border-l pl-8" : ""}
                  style={i > 0 ? { borderColor: "rgba(255,255,255,0.07)" } : {}}
                >
                  <div className="font-display text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — deals list */}
          <div className="space-y-3">
            {marketplaceDeals.map((deal, i) => (
              <motion.div
                key={i}
                className="group rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.022)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                whileHover={{ borderColor: "rgba(255,255,255,0.12)", scale: 1.005 }}
                {...stagger(i)}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.2)" }}
                  >
                    {deal.brand.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-white font-semibold">
                      {deal.brand}{" "}
                      <span className="text-white/25">×</span>{" "}
                      {deal.creator}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/30">{deal.category}</span>
                      <span className="text-[10px] text-white/15">·</span>
                      <span className="text-[10px] text-violet-400 font-semibold">
                        {deal.match}% match
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-sm font-bold text-white">{deal.value}</div>
                  <div
                    className="text-[10px] font-semibold mt-0.5"
                    style={{ color: deal.status === "Active" ? "#34d399" : "#fbbf24" }}
                  >
                    {deal.status}
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="text-center pt-3">
              <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-semibold flex items-center gap-1.5 mx-auto">
                Explore the marketplace
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ───────────────────────────────────────────────────────────

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="py-32"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-16" {...fadeUp}>
          <Tag color="violet">Pricing</Tag>
          <h2 className="font-display text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Built to scale with
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              your ambition.
            </span>
          </h2>

          {/* Toggle */}
          <div
            className="inline-flex items-center gap-1 mt-8 rounded-xl p-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {[
              { label: "Monthly", value: false },
              { label: "Annual", value: true, badge: "Save 20%" },
            ].map((opt) => (
              <button
                key={opt.label}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={
                  annual === opt.value
                    ? { background: "rgba(124,58,237,0.3)", color: "#fff" }
                    : { color: "rgba(255,255,255,0.35)" }
                }
                onClick={() => setAnnual(opt.value)}
              >
                {opt.label}
                {opt.badge && (
                  <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)" }}>
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className="relative rounded-2xl p-7 flex flex-col"
              style={
                plan.featured
                  ? {
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(124,58,237,0.45)",
                      boxShadow: "0 0 80px rgba(124,58,237,0.12)",
                    }
                  : {
                      background: "rgba(255,255,255,0.022)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }
              }
              {...stagger(i)}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
                    style={{
                      background: plan.featured
                        ? "linear-gradient(135deg, #7c3aed, #2563eb)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-base font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-white/30">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.monthlyPrice !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-white">
                      ${annual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-white/30 text-sm">/mo</span>
                  </div>
                ) : (
                  <div className="font-display text-3xl font-extrabold text-white">Custom</div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={
                        plan.featured
                          ? { background: "rgba(139,92,246,0.25)", color: "#a78bfa" }
                          : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                      }
                    >
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm text-white/50">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta === "Contact Sales" ? "/login" : "/signup"}
                className="block w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-200 hover:opacity-90"
                style={
                  plan.featured
                    ? {
                        background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                        color: "#fff",
                        boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
                      }
                    : {
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.65)",
                      }
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Section ──────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section
      className="py-32"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div className="text-center mb-16" {...fadeUp}>
          <h2 className="font-display text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            What our beta
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              testers are saying.
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl p-7 flex flex-col"
              style={{
                background: "rgba(255,255,255,0.022)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              {...stagger(i)}
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <blockquote className="text-white/60 text-sm leading-relaxed flex-1 mb-7">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/30 mt-0.5">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section
      className="py-32 relative overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div {...fadeUp}>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-10 text-xs font-bold uppercase tracking-widest text-violet-400"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.28)",
            }}
          >
            <Zap className="w-3 h-3" />
            The future of creator business management
          </div>

          <h2 className="font-display text-[4rem] lg:text-[5.5rem] font-extrabold text-white tracking-[-0.03em] mb-6 leading-[1.02]">
            Ready to run your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              creator empire?
            </span>
          </h2>

          <p className="text-white/40 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Start building your creator business on one platform.
            No credit card required.
          </p>

          <div className="flex flex-wrap justify-center gap-5 mb-8">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                boxShadow: "0 12px 48px rgba(124,58,237,0.45)",
              }}
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white/70 hover:text-white transition-all duration-200 hover:border-white/20"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Sign in
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Shield, text: "14-day free trial" },
              { icon: Check, text: "No credit card required" },
              { icon: Activity, text: "Cancel anytime" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-white/25 font-medium">
                <Icon className="w-3.5 h-3.5" />
                {text}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Creator CRM", href: "#features" },
        { label: "Sponsor CRM", href: "#features" },
        { label: "Contract Management", href: "#features" },
        { label: "Opportunity Marketplace", href: "#marketplace" },
        { label: "AI Assistant", href: "#ai" },
        { label: "Analytics", href: "#features" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#product" },
        { label: "Blog", href: "#product" },
        { label: "Careers", href: "#product" },
        { label: "Press", href: "#product" },
        { label: "Partners", href: "#product" },
        { label: "Contact", href: "/login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Security", href: "/privacy" },
        { label: "Compliance", href: "/privacy" },
        { label: "Cookie Settings", href: "/privacy" },
      ],
    },
  ];

  return (
    <footer
      className="py-16 px-6"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-[15px]">Player One IQ</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-6">
              The operating system for the creator economy. Manage creators, deals,
              contracts, and revenue from one intelligent platform.
            </p>
            <div className="flex gap-2.5">
              {[Twitter, Linkedin, Globe].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/20 mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/35 hover:text-white/65 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-xs text-white/18">
            &copy; {new Date().getFullYear()} Player One IQ, Inc. All rights reserved.
          </p>
          <p className="text-xs text-white/18">
            Built for serious creator businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────

export function MarketingLandingClient() {
  return (
    <div className="marketing-landing min-h-screen overflow-x-hidden scrollbar-hide"
      style={{ background: "#06060f", color: "#f1f5f9" }}
    >
      <Nav />
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <AISection />
      <AnalyticsSection />
      <MarketplaceSection />
      <PricingSection />
      <TestimonialsSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
