import { Users, Building2, FileText, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";

const stats = [
  {
    title: "Active Creators",
    value: "128",
    change: "+12%",
    trend: "up" as const,
    icon: Users,
    iconColor: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  },
  {
    title: "Active Sponsors",
    value: "47",
    change: "+8%",
    trend: "up" as const,
    icon: Building2,
    iconColor: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  },
  {
    title: "Active Contracts",
    value: "93",
    change: "+5%",
    trend: "up" as const,
    icon: FileText,
    iconColor: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20",
  },
  {
    title: "Monthly Revenue",
    value: "$284K",
    change: "+18%",
    trend: "up" as const,
    icon: DollarSign,
    iconColor: "bg-accent/10 text-accent-light ring-accent/20",
  },
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your creator and sponsor ecosystem"
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="text-base font-semibold text-white">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest updates across your platform
          </p>
          <ul className="mt-6 space-y-4">
            {[
              {
                action: "New contract signed",
                detail: "Nike × @CreatorMike",
                time: "2 hours ago",
              },
              {
                action: "Creator onboarded",
                detail: "@SarahStreams joined",
                time: "5 hours ago",
              },
              {
                action: "Sponsor renewal",
                detail: "Red Bull extended Q2 deal",
                time: "1 day ago",
              },
              {
                action: "Contract completed",
                detail: "Adidas × @GamePro delivered",
                time: "2 days ago",
              },
            ].map((item) => (
              <li
                key={item.detail}
                className="flex items-center justify-between border-b border-border-subtle pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {item.action}
                  </p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-600">{item.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="text-base font-semibold text-white">
            Top Performing Creators
          </h2>
          <p className="mt-1 text-sm text-gray-500">By revenue this month</p>
          <ul className="mt-6 space-y-4">
            {[
              { name: "@CreatorMike", revenue: "$42,800", growth: "+24%" },
              { name: "@SarahStreams", revenue: "$38,200", growth: "+19%" },
              { name: "@GamePro", revenue: "$31,500", growth: "+15%" },
              { name: "@TechVibes", revenue: "$28,900", growth: "+11%" },
            ].map((creator, i) => (
              <li
                key={creator.name}
                className="flex items-center gap-4 border-b border-border-subtle pb-4 last:border-0 last:pb-0"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-light">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">
                    {creator.name}
                  </p>
                  <p className="text-xs text-gray-500">{creator.revenue}</p>
                </div>
                <span className="text-xs font-medium text-emerald-400">
                  {creator.growth}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
}
