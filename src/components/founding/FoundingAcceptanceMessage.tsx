import type { ReactNode } from "react";

interface FoundingAcceptanceMessageProps {
  className?: string;
  showCta?: boolean;
  ctaHref?: string;
}

/** Reusable copy for future acceptance email/page/dashboard states. */
export function FoundingAcceptanceMessage({
  className = "",
  showCta = false,
  ctaHref = "/signup",
}: FoundingAcceptanceMessageProps) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400 mb-4">
        You&apos;re on the roster
      </p>
      <h2 className="font-display text-4xl font-extrabold text-white tracking-tight mb-6">
        Welcome to the Player One IQ Founding Roster.
      </h2>
      <div className="space-y-4 text-white/55 text-base leading-relaxed max-w-2xl">
        <p>
          You&apos;re joining a hand-selected group of creators helping shape what
          we&apos;re building before the rest of the world gets access.
        </p>
        <p>
          Your next step is to activate your Player One IQ account and connect your
          creator ecosystem.
        </p>
        <p className="text-white/80 font-medium">Welcome to Player One. Let&apos;s build.</p>
      </div>
      {showCta ? (
        <a
          href={ctaHref}
          className="mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          }}
        >
          Activate your account
        </a>
      ) : null}
    </div>
  );
}

export function FoundingAcceptancePreview({ children }: { children?: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-8"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children ?? <FoundingAcceptanceMessage />}
    </div>
  );
}
