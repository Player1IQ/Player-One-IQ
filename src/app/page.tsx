import type { Metadata } from "next";
import { MarketingLanding } from "@/components/marketing/MarketingLanding";

export const metadata: Metadata = {
  title: "Player One IQ — Creator Snapshot and creator operations",
  description:
    "Connect Twitch or Kick for a free Creator Snapshot, or open an agency workspace. Founding Roster applications remain open as a secondary path.",
  openGraph: {
    title: "Player One IQ",
    description:
      "Manage creators, sponsors, campaigns, and contracts in one platform built for gaming agencies and creator organizations.",
  },
};

export default function MarketingHomePage() {
  return <MarketingLanding />;
}
