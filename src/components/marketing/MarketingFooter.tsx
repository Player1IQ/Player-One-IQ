import Link from "next/link";
import { Globe, Linkedin, Twitter, Zap } from "lucide-react";
import { FOUNDING_ROSTER_PATH, SOCIAL_X_URL } from "@/lib/marketing/config";

export function MarketingFooter() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Platform", href: "/#product" },
        { label: "Features", href: "/#features" },
        { label: "AI", href: "/#ai" },
        { label: "Founding Roster", href: FOUNDING_ROSTER_PATH },
        { label: "Pricing", href: "/#pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Founding Roster", href: FOUNDING_ROSTER_PATH },
        { label: "Sign in", href: "/login" },
        { label: "Contact", href: FOUNDING_ROSTER_PATH },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="py-16 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-[15px]">
                Player One IQ
              </span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-6">
              The operating system for the creator economy — professional
              infrastructure for growth, revenue, partnerships, and your creator
              business.
            </p>
            <div className="flex gap-2.5">
              {SOCIAL_X_URL ? (
                <a
                  href={SOCIAL_X_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  aria-label="Follow on X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              ) : null}
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/15"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                aria-hidden
              >
                <Linkedin className="w-4 h-4" />
              </span>
              <Link
                href="/"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                aria-label="Player One IQ home"
              >
                <Globe className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/20 mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/35 hover:text-white/65 transition-colors"
                    >
                      {link.label}
                    </Link>
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
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/25 md:justify-end">
            <Link href="/privacy" className="hover:text-white/55 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white/55 transition-colors">
              Terms of Service
            </Link>
            <a
              href="mailto:Admin@playeroneIQ.com"
              className="hover:text-white/55 transition-colors"
            >
              Admin@playeroneIQ.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
