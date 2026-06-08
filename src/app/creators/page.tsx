import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorsPageClient } from "@/components/creators/CreatorsPageClient";
import { creators } from "@/lib/creators";

export default function CreatorsPage() {
  return (
    <DashboardLayout
      title="Creators"
      description="Manage your creator roster and partnerships"
    >
      <CreatorsPageClient creators={creators} />
    </DashboardLayout>
  );
}
