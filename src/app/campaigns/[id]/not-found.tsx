import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft } from "lucide-react";

export default function CampaignNotFound() {
  return (
    <DashboardLayout title="Campaign not found">
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-400">
          This campaign does not exist or you do not have access.
        </p>
        <Link
          href="/campaigns"
          className="mt-4 inline-flex items-center gap-2 text-sm text-accent-light hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
      </div>
    </DashboardLayout>
  );
}
