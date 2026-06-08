import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { SupabaseConfigBanner } from "./SupabaseConfigBanner";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-surface-raised lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface-raised to-surface" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-10 bottom-20 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 p-10">
          <Link href="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 ring-1 ring-accent/40">
              <Gamepad2 className="h-5 w-5 text-accent-light" />
            </div>
            <span className="text-lg font-bold text-white">Player One IQ</span>
          </Link>
        </div>

        <div className="relative z-10 px-10 pb-16">
          <h2 className="text-3xl font-bold leading-tight text-white">
            The creator economy,
            <br />
            <span className="text-accent-light">managed.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
            Unify creators, sponsors, contracts, and team workflows in one
            premium platform built for gaming agencies and creator organizations.
          </p>
          <div className="mt-8 flex gap-6 text-sm text-gray-500">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/40">
                <Gamepad2 className="h-4 w-4 text-accent-light" />
              </div>
              <span className="font-bold text-white">Player One IQ</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </div>

          <SupabaseConfigBanner />
          {children}
        </div>
      </div>
    </div>
  );
}
