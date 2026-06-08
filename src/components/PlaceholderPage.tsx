import { DashboardLayout } from "./DashboardLayout";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <DashboardLayout title={title} description={description}>
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-300">{title}</p>
          <p className="mt-1 text-sm text-gray-500">Coming soon</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
