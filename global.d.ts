import type common from "./messages/en/common.json";
import type nav from "./messages/en/nav.json";
import type commandPalette from "./messages/en/commandPalette.json";
import type team from "./messages/en/team.json";
import type teamPage from "./messages/en/team-page.json";
import type subscription from "./messages/en/subscription.json";
import type status from "./messages/en/status.json";
import type auth from "./messages/en/auth.json";
import type settings from "./messages/en/settings.json";
import type portal from "./messages/en/portal.json";
import type dashboard from "./messages/en/dashboard.json";
import type creators from "./messages/en/creators.json";
import type contracts from "./messages/en/contracts.json";
import type opportunities from "./messages/en/opportunities.json";
import type schedule from "./messages/en/schedule.json";
import type messages from "./messages/en/messages.json";
import type billing from "./messages/en/billing.json";
import type sponsors from "./messages/en/sponsors.json";
import type reports from "./messages/en/reports.json";
import type ai from "./messages/en/ai.json";
import type pages from "./messages/en/pages.json";
import type coach from "./messages/en/coach.json";
import type onboarding from "./messages/en/onboarding.json";

type AppMessages = typeof common & {
  nav: typeof nav;
  commandPalette: typeof commandPalette;
  team: typeof team;
  teamPage: typeof teamPage;
  subscription: typeof subscription;
  status: typeof status;
  auth: typeof auth;
  settings: typeof settings;
  portal: typeof portal;
  dashboard: typeof dashboard;
  creators: typeof creators;
  contracts: typeof contracts;
  opportunities: typeof opportunities;
  schedule: typeof schedule;
  messages: typeof messages;
  billing: typeof billing;
  sponsors: typeof sponsors;
  reports: typeof reports;
  ai: typeof ai;
  pages: typeof pages;
  coach: typeof coach;
  onboarding: typeof onboarding;
};

declare module "next-intl" {
  interface AppConfig {
    Messages: AppMessages;
  }
}

export {};
