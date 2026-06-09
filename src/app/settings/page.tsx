import { DashboardLayout } from "@/components/DashboardLayout";
import { SeedTestDataButton } from "@/components/dev/SeedTestDataButton";
import { isSeedEnabled } from "@/lib/seed/constants";

export default function SettingsPage() {
  const showDevTools = isSeedEnabled();

  return (
    <DashboardLayout
      title="Settings"
      description="Configure your workspace preferences"
    >
      {showDevTools ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Development
            </h2>
            <div className="mt-4">
              <SeedTestDataButton variant="card" />
            </div>
          </section>
        </div>
      ) : (
        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-300">Settings</p>
            <p className="mt-1 text-sm text-gray-500">Coming soon</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
