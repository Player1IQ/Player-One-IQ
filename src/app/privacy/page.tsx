import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-gray-200">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="text-sm text-accent-light hover:underline">
          ← Player One IQ
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-gray-300">
          <p>
            Player One IQ collects account information you provide (such as
            email and organization details) and platform data you authorize via
            OAuth (such as channel handles and analytics used in your
            dashboard).
          </p>
          <p>
            Connected platform tokens are stored securely and used only to sync
            profiles, revenue estimates, and content insights for your
            workspace. We do not sell your personal data.
          </p>
          <p>
            Third-party logins (Google, Twitch, TikTok, etc.) are subject to
            those providers&apos; policies. You can disconnect platforms at any
            time from creator settings.
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
