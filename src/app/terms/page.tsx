import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-gray-200">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="text-sm text-accent-light hover:underline">
          ← Player One IQ
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-gray-300">
          <p>
            Player One IQ provides creator and sponsor management tools for
            agencies and organizations. By using this service, you agree to use
            it lawfully and in accordance with applicable platform policies.
          </p>
          <p>
            You are responsible for accounts you connect (including YouTube,
            Twitch, and TikTok) and for data you manage within your workspace.
          </p>
          <p>
            The service is provided as-is during early access. Features may
            change without notice.
          </p>
          <p>
            Questions:{" "}
            <a
              href="mailto:johnsantin16@gmail.com"
              className="text-accent-light hover:underline"
            >
              johnsantin16@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
