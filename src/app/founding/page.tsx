import type { Metadata } from "next";
import "@/styles/marketing.css";
import { FoundingRosterClient } from "@/components/founding/FoundingRosterClient";

const description =
  "Apply to the Player One IQ Founding Roster, a hand-selected group of creators and organizations helping shape the operating system for the creator economy.";

export const metadata: Metadata = {
  title: "Player One IQ Founding Roster | Early Access for Creators",
  description,
  openGraph: {
    title: "Player One IQ Founding Roster | Early Access for Creators",
    description,
    siteName: "Player One IQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Player One IQ Founding Roster",
    description,
  },
};

export default function FoundingRosterPage() {
  return <FoundingRosterClient />;
}
