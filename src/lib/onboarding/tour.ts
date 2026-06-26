import type { TeamRole } from "@/lib/team";
import {
  canAccessStaffDashboard,
  isCreatorPortalRole,
  isSponsorPortalRole,
} from "@/lib/team";
import type { OnboardingFlow, OnboardingTourItem, PortalTourStep } from "./types";

const creatorTour: OnboardingTourItem[] = [
  {
    title: "Portal home",
    description:
      "Your command center for earnings, applications, marketplace deals, and profile readiness.",
    href: "/portal",
    icon: "home",
  },
  {
    title: "Opportunities",
    description:
      "Browse agency listings and the open marketplace, then apply to sponsorship deals that fit your brand.",
    href: "/opportunities",
    icon: "briefcase",
  },
  {
    title: "My applications",
    description:
      "Track submitted applications, follow up on pending deals, and see when brands respond.",
    href: "/opportunities/applications",
    icon: "target",
  },
  {
    title: "Growth",
    description:
      "Connect platforms to unlock audience analytics, content performance, and growth insights.",
    href: "/portal/growth",
    icon: "bar-chart",
  },
  {
    title: "Deliverables",
    description:
      "See sponsored content due dates, upload proof, and stay on top of campaign obligations.",
    href: "/portal/deliverables",
    icon: "file-text",
  },
  {
    title: "Contracts",
    description:
      "Review active deals, milestones, and deliverable terms with your partners.",
    href: "/contracts",
    icon: "file-text",
  },
  {
    title: "Messages",
    description:
      "Chat with agencies and sponsors about active deals without leaving the portal.",
    href: "/messages",
    icon: "message-square",
  },
  {
    title: "Schedule",
    description:
      "Block time when you are unavailable and see meetings you are invited to.",
    href: "/schedule",
    icon: "calendar",
  },
  {
    title: "My profile",
    description:
      "Update your bio, availability, social handles, and platform connections anytime.",
    href: "/portal/profile",
    icon: "users",
  },
];

const agencyTour: OnboardingTourItem[] = [
  {
    title: "Dashboard",
    description:
      "A snapshot of creators, sponsors, pipeline value, and what needs attention today.",
    href: "/",
    icon: "home",
  },
  {
    title: "Creators",
    description:
      "Manage your roster, connect their platforms, and keep profiles sponsorship-ready.",
    href: "/creators",
    icon: "users",
  },
  {
    title: "Sponsors",
    description:
      "Track brand partners, campaign history, and relationship details.",
    href: "/sponsors",
    icon: "building",
  },
  {
    title: "Opportunities",
    description:
      "Post deals, review applicants, and run your open marketplace listings.",
    href: "/opportunities",
    icon: "briefcase",
  },
  {
    title: "Contracts & campaigns",
    description:
      "Move deals through pipeline stages and coordinate deliverables across campaigns.",
    href: "/contracts",
    icon: "file-text",
  },
  {
    title: "Team",
    description:
      "Invite colleagues, assign roles, and manage who can access your workspace.",
    href: "/team",
    icon: "user-cog",
  },
  {
    title: "Messages",
    description:
      "Keep deal conversations in sync with creators, sponsors, and your team.",
    href: "/messages",
    icon: "message-square",
  },
  {
    title: "Schedule",
    description:
      "Plan meetings, practice sessions, and see creator availability at a glance.",
    href: "/schedule",
    icon: "calendar",
  },
];

const sponsorTour: OnboardingTourItem[] = [
  {
    title: "Sponsor portal",
    description:
      "Your home for active campaigns, contracts, and creator collaboration.",
    href: "/portal",
    icon: "home",
  },
  {
    title: "Campaigns",
    description:
      "Launch sponsorship campaigns and track creator participation.",
    href: "/campaigns",
    icon: "target",
  },
  {
    title: "Contracts",
    description:
      "Review deal terms, milestones, and deliverable status with your partners.",
    href: "/contracts",
    icon: "file-text",
  },
  {
    title: "Messages",
    description:
      "Coordinate directly with agencies and creators on active partnerships.",
    href: "/messages",
    icon: "message-square",
  },
  {
    title: "Company profile",
    description:
      "Keep your brand details current so creators know who they're working with.",
    href: "/portal/profile",
    icon: "building",
  },
];

function toPortalTourSteps(items: OnboardingTourItem[]): PortalTourStep[] {
  return items.map((item) => ({
    id: item.href,
    title: item.title,
    description: item.description,
    navHref: item.href,
    highlight: "nav" as const,
    placement: "right" as const,
  }));
}

export function getPortalTourSteps(role: TeamRole | null): PortalTourStep[] {
  return toPortalTourSteps(getOnboardingFlow(role).tourItems);
}

export function getOnboardingFlow(role: TeamRole | null): OnboardingFlow {
  if (isCreatorPortalRole(role)) {
    return {
      audience: "creator",
      steps: ["welcome", "connect", "finish"],
      tourItems: creatorTour,
      finishHref: "/portal",
      finishLabel: "Enter creator portal",
    };
  }

  if (isSponsorPortalRole(role)) {
    return {
      audience: "sponsor",
      steps: ["welcome", "finish"],
      tourItems: sponsorTour,
      finishHref: "/portal",
      finishLabel: "Go to sponsor portal",
    };
  }

  if (role && canAccessStaffDashboard(role)) {
    return {
      audience: "agency",
      steps: ["welcome", "finish"],
      tourItems: agencyTour,
      finishHref: "/",
      finishLabel: "Go to dashboard",
    };
  }

  return {
    audience: "agency",
    steps: ["welcome", "finish"],
    tourItems: agencyTour,
    finishHref: "/",
    finishLabel: "Go to dashboard",
  };
}
