"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { FOUNDING_ROSTER_PATH } from "@/lib/marketing/config";

const NAV_ITEMS = [
  { label: "Product", href: "/#product" },
  { label: "Features", href: "/#features" },
  { label: "Founding Roster", href: FOUNDING_ROSTER_PATH },
  { label: "Pricing", href: "/#pricing" },
];

const MOBILE_NAV_ITEMS = [
  ...NAV_ITEMS,
  { label: "Sign in", href: "/login" },
];

interface MarketingNavProps {
  activePath?: string;
}

export function MarketingNav({ activePath }: MarketingNavProps) {
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

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-sm transition-colors font-medium ${
                activePath === item.href
                  ? "text-white"
                  : "text-white/45 hover:text-white/85"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:block text-sm text-white/55 hover:text-white transition-colors font-medium"
          >
            Sign in
          </Link>
          <Link
            href={FOUNDING_ROSTER_PATH}
            className="text-sm px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
            }}
          >
            Join the Founding Roster
          </Link>
          <button
            type="button"
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          className="md:hidden mt-4 mx-6 rounded-2xl p-5 space-y-3"
          style={{
            background: "rgba(13,13,31,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {MOBILE_NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block text-sm text-white/60 hover:text-white py-2 border-b border-white/[0.05] last:border-0 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
