import Link from "next/link";
import { SupabaseConfigBanner } from "./SupabaseConfigBanner";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-surface-raised to-surface" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute -right-10 bottom-20 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="absolute inset-0 bg-mesh-gradient opacity-60" />

        <div className="relative z-10 p-10">
          <Link href="/login" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-muted shadow-glow-active">
              <span className="text-sm font-black text-white">P1</span>
            </div>
            <span className="text-xl font-bold text-white">Player One IQ</span>
          </Link>
        </div>

        <div className="relative z-10 px-10 pb-16">
          <h2 className="text-4xl font-bold leading-tight text-white">
            The creator economy,
            <br />
            <span className="bg-gradient-to-r from-accent-light to-white bg-clip-text text-transparent">
              managed.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
            Unify creators, sponsors, contracts, and team workflows in one
            premium platform built for gaming agencies and creator organizations.
          </p>
          <div className="mt-10 flex gap-8 text-sm text-gray-500">
            <div>
              <p className="text-2xl font-bold text-white">128+</p>
              <p>Creators managed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">$664K</p>
              <p>Deal pipeline</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">47</p>
              <p>Active sponsors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/login" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-muted">
                <span className="text-xs font-black text-white">P1</span>
              </div>
              <span className="font-bold text-white">Player One IQ</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </div>

          <SupabaseConfigBanner />
          {children}
        </div>
      </div>
    </div>
  );
}
