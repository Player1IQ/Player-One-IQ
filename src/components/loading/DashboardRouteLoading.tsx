import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

interface DashboardRouteLoadingProps {
  title?: string;
}

export function DashboardRouteLoading({
  title = "Loading…",
}: DashboardRouteLoadingProps) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/[0.06] bg-surface-raised/80 lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
          <div className="flex h-14 items-center px-4 lg:h-16 lg:px-8">
            <Skeleton className="h-6 w-40 lg:hidden" />
            <Skeleton className="hidden h-7 w-48 lg:block" />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <p className="sr-only">{title}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    </div>
  );
}
