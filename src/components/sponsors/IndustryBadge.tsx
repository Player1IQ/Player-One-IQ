import type { Industry } from "@/lib/sponsors";

const industryStyles: Record<Industry, string> = {
  Gaming: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  Apparel: "bg-pink-500/10 text-pink-400 ring-pink-500/20",
  Beverages: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
  Technology: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  Automotive: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
  Entertainment: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20",
  "Consumer Electronics":
    "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
};

interface IndustryBadgeProps {
  industry: Industry;
}

export function IndustryBadge({ industry }: IndustryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${industryStyles[industry]}`}
    >
      {industry}
    </span>
  );
}
