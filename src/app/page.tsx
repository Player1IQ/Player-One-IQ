import type { Metadata } from "next";
import { MarketingLanding } from "@/components/marketing/MarketingLanding";

export const metadata: Metadata = {
  title: "Player One IQ — Creator economy management",
  description:
    "Manage creators, sponsors, campaigns, and contracts in one platform built for gaming agencies and creator organizations.",
  openGraph: {
    title: "Player One IQ",
    description:
      "Manage creators, sponsors, campaigns, and contracts in one platform built for gaming agencies and creator organizations.",
  },
};

export default function MarketingHomePage() {
  return <MarketingLanding />;
}
