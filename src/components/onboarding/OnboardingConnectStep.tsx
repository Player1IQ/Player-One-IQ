import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("onboarding.wizard.connect");
  const returnTo = encodeURIComponent("/onboarding?step=connect");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">{t("title")}</h2>
        <p className="mt-2 text-sm text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
          <Link2 className="h-4 w-4 text-accent-light" />
          {t("oauthHeading")}
        </div>
        <OAuthPlatformActions
          creatorId={creatorId}
          platforms={oauthPlatformUi}
          layout="stack"
          returnTo="/onboarding?step=connect"
        />
      </div>

      <p className="text-xs leading-relaxed text-gray-500">{t("betaNote")}</p>

      <p className="text-xs leading-relaxed text-gray-500">
        {t.rich("profileLink", {
          link: (chunks) => (
            <a
              href={`/creators/${creatorId}?returnTo=${returnTo}`}
              className="text-gray-400 underline hover:text-gray-200"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </div>
  );
}
