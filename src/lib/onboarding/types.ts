export type OnboardingAudience = "creator" | "agency" | "sponsor";

export type OnboardingStepId = "welcome" | "connect" | "finish";

export interface PortalTourStep {
  id: string;
  title: string;
  description: string;
  /** Sidebar link href to spotlight */
  navHref?: string;
  /** Main content region id via data-tour-spot */
  contentSpot?: string;
  /** Prefer sidebar nav over content region when both are set */
  highlight?: "nav" | "content";
  placement?: "right" | "bottom" | "center";
}

export interface OnboardingTourItem {
  title: string;
  description: string;
  href: string;
  icon:
    | "home"
    | "users"
    | "building"
    | "target"
    | "briefcase"
    | "file-text"
    | "message-square"
    | "bar-chart"
    | "calendar"
    | "sparkles"
    | "user-cog";
}

export interface OnboardingFlow {
  audience: OnboardingAudience;
  steps: OnboardingStepId[];
  tourItems: OnboardingTourItem[];
  finishHref: string;
  finishLabel: string;
}
