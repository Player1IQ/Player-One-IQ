import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorAudienceGrowth } from "@/components/creators/CreatorAudienceGrowth";
import { getCreatorById } from "@/lib/creators/queries";
import { getCreatorPlatformSummary } from "@/lib/creators/platform-summary";
import { getCreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { requireCreatorPortalUser } from "@/lib/portal/guard";
import { getSubscriptionContext } from "@/lib/subscription/queries";
import { hasAnyFeature, hasFeature } from "@/lib/subscription/features";
import { PortalGrowthPanel } from "@/components/portal/PortalGrowthPanel";
import Link from "next/link";
import { Link2 } from "lucide-react";

export default async function PortalGrowthPage() {
  const t = await getTranslations("pages.portalGrowth");
  const tPortal = await getTranslations("portal.growth");
  const { linkedCreatorId } = await requireCreatorPortalUser();

  const [creator, platformSummary, audienceAnalytics, subscription] =
    await Promise.all([
      getCreatorById(linkedCreatorId),
      getCreatorPlatformSummary(linkedCreatorId),
      getCreatorAudienceAnalytics(linkedCreatorId),
      getSubscriptionContext(),
    ]);

  if (!creator) {
    redirect("/portal");
  }

  const canViewAnalytics = hasAnyFeature(subscription.features, [
    "limited_analytics",
    "advanced_analytics",
  ]);
  const canViewAdvancedAnalytics = hasFeature(
    subscription.features,
    "advanced_analytics"
  );

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <div className="space-y-6 animate-fade-in">
        <PortalGrowthPanel creatorId={creator.id} summary={platformSummary} />

        {canViewAnalytics ? (
          <CreatorAudienceGrowth
            analytics={audienceAnalytics}
            canViewAnalytics={canViewAnalytics}
            canViewAdvancedAnalytics={canViewAdvancedAnalytics}
          />
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center">
            <p className="text-sm text-gray-400">{tPortal("upgradeHint")}</p>
            <Link
              href={`/creators/${creator.id}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-light hover:text-white"
            >
              <Link2 className="h-4 w-4" />
              {tPortal("connectOnProfile")}
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
