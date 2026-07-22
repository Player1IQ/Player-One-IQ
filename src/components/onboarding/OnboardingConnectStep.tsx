import { Link2 } from "lucide-react";
import { OAuthPlatformActions } from "@/components/creators/OAuthPlatformActions";
import type { OAuthPlatformUi } from "@/lib/platform-oauth/types";

interface OnboardingConnectStepProps {
  creatorId: string;
  oauthPlatformUi: OAuthPlatformUi[];
}

export function OnboardingConnectStep({
  creatorId,
  oauthPlatformUi,
}: OnboardingConnectStepProps) {
  const returnTo = encodeURIComponent("/onboarding?step=connect");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Connect your platforms</h2>
        <p className="mt-2 text-sm text-gray-400">
          Link YouTube, Twitch, Instagram, or TikTok to unlock growth analytics,
          revenue tracking, and a stronger creator profile for sponsors.
        </p>
      </div>

      <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
          <Link2 className="h-4 w-4 text-accent-light" />
          One-click OAuth connections
        </div>
        <OAuthPlatformActions
          creatorId={creatorId}
          platforms={oauthPlatformUi}
          layout="stack"
          returnTo="/onboarding?step=connect"
        />
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        During beta, YouTube uses Google sign-in. If Google blocks access, your
        workspace admin must add your Gmail as a Google OAuth test user. TikTok
        requires Login Kit to be configured for this app.
      </p>

      <p className="text-xs leading-relaxed text-gray-500">
        You can add more platforms or enter handles manually later from{" "}
        <a
          href={`/creators/${creatorId}?returnTo=${returnTo}`}
          className="text-gray-400 underline hover:text-gray-200"
        >
          your creator profile
        </a>
        .
      </p>
    </div>
  );
}
