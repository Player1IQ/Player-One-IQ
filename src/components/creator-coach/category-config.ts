import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  DollarSign,
  GraduationCap,
  Handshake,
  Heart,
  LineChart,
  Palette,
  Radio,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { RecommendationCategory } from "@/lib/creator-coach/types";

export const categoryIcons: Record<RecommendationCategory, LucideIcon> = {
  Content: Sparkles,
  Streaming: Radio,
  Community: Users,
  Sponsors: Handshake,
  Business: Briefcase,
  Monetization: DollarSign,
  Productivity: Zap,
  Learning: GraduationCap,
  Networking: Heart,
  Branding: Palette,
  Analytics: BarChart3,
  Revenue: LineChart,
  Goals: Target,
  "Personal Development": GraduationCap,
  Financial: Wallet,
};

export const priorityStyles = {
  Critical: {
    badge: "bg-red-500/15 text-red-300 ring-red-500/30",
    dot: "bg-red-400",
  },
  High: {
    badge: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
    dot: "bg-orange-400",
  },
  Medium: {
    badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    dot: "bg-amber-400",
  },
  Low: {
    badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    dot: "bg-sky-400",
  },
} as const;
