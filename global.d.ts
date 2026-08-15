import type en from "./messages/en/common.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
  }
}
