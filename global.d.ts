import type common from "./messages/en/common.json";
import type nav from "./messages/en/nav.json";
import type commandPalette from "./messages/en/commandPalette.json";
import type team from "./messages/en/team.json";
import type subscription from "./messages/en/subscription.json";
import type status from "./messages/en/status.json";

type AppMessages = typeof common & {
  nav: typeof nav;
  commandPalette: typeof commandPalette;
  team: typeof team;
  subscription: typeof subscription;
  status: typeof status;
};

declare module "next-intl" {
  interface AppConfig {
    Messages: AppMessages;
  }
}

export {};
