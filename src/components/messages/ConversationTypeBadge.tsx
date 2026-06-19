import { Briefcase, FileText, MessageCircle, Users } from "lucide-react";
import {
  type ConversationType,
  conversationTypeLabels,
} from "@/lib/messages";

const icons: Record<ConversationType, typeof MessageCircle> = {
  direct: MessageCircle,
  group: Users,
  opportunity: Briefcase,
  contract: FileText,
};

const colors: Record<ConversationType, string> = {
  direct: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  group: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  opportunity: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  contract: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20",
};

export function ConversationTypeBadge({ type }: { type: ConversationType }) {
  const Icon = icons[type];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${colors[type]}`}
    >
      <Icon className="h-3 w-3" />
      {conversationTypeLabels[type]}
    </span>
  );
}
