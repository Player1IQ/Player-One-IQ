import { SEED_MARKER, SEED_TITLE_PREFIX } from "./constants";

function futureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getSeedCreatorRows(organizationId: string) {
  return [
    {
      organization_id: organizationId,
      name: "Demo: Alex Streams",
      email: "alex.streams@example.com",
      primary_platform: "YouTube",
      social_handles: [{ platform: "YouTube", handle: "@alexstreams" }],
      status: "active",
      notes: SEED_MARKER,
    },
    {
      organization_id: organizationId,
      name: "Demo: Jordan Plays",
      email: "jordan.plays@example.com",
      primary_platform: "Twitch",
      social_handles: [{ platform: "Twitch", handle: "jordanplays" }],
      status: "active",
      notes: SEED_MARKER,
    },
    {
      organization_id: organizationId,
      name: "Demo: Sam Creates",
      email: "sam.creates@example.com",
      primary_platform: "TikTok",
      social_handles: [{ platform: "TikTok", handle: "@samcreates" }],
      status: "active",
      notes: SEED_MARKER,
    },
  ];
}

export function getSeedSponsorRow(organizationId: string) {
  return {
    organization_id: organizationId,
    company_name: "Demo: Nexus Gaming",
    industry: "Gaming",
    status: "active",
    website: "https://example.com/nexus-gaming",
    headquarters: "Los Angeles, CA",
    founded: "2018",
    description: "Sample sponsor for testing sponsorship workflows.",
    primary_contact: {
      name: "Taylor Reed",
      title: "Partnerships Manager",
      email: "taylor@nexusgaming.example",
      phone: "555-0100",
    },
    secondary_contact: null,
    internal_notes: SEED_MARKER,
  };
}

export function getSeedOpportunityRow(organizationId: string) {
  return {
    organization_id: organizationId,
    title: `${SEED_TITLE_PREFIX} Summer Gaming Sponsorship`,
    description:
      "Looking for gaming creators for a 3-month brand integration campaign. Includes dedicated videos and social posts.",
    budget: 15000,
    category: "Gaming",
    platform: "YouTube",
    deliverables:
      "2 dedicated videos\n4 Instagram stories\n1 Twitch stream integration",
    application_deadline: futureDate(30),
    status: "open",
  };
}

export function isSeedOpportunityTitle(title: string): boolean {
  return title.startsWith(SEED_TITLE_PREFIX);
}
