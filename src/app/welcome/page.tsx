import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-gray-200">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 ring-1 ring-accent/40">
          <Gamepad2 className="h-7 w-7 text-accent-light" />
        </div>
        <h1 className="mt-6 text-4xl font-bold text-white">Player One IQ</h1>
        <p className="mt-4 text-lg text-gray-400">
          Creator and sponsor management for gaming agencies and creator
          organizations.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-border px-6 py-2.5 text-sm text-gray-200"
          >
            Create account
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-gray-300">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
