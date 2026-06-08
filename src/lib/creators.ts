export type CreatorStatus = "active" | "inactive" | "pending" | "on-hold";

export type Platform =
  | "YouTube"
  | "Twitch"
  | "TikTok"
  | "Instagram"
  | "Kick";

export interface SocialAccount {
  platform: Platform;
  handle: string;
  followers: string;
  url: string;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

export interface SponsorshipRecord {
  id: string;
  sponsor: string;
  campaign: string;
  value: string;
  status: "active" | "completed" | "pending";
  startDate: string;
  endDate?: string;
}

export interface Creator {
  id: string;
  name: string;
  displayName: string;
  email: string;
  primaryPlatform: Platform;
  status: CreatorStatus;
  activeSponsors: number;
  avatarInitials: string;
  avatarColor: string;
  bio: string;
  location: string;
  joinedDate: string;
  socialAccounts: SocialAccount[];
  metrics: PerformanceMetric[];
  sponsorshipHistory: SponsorshipRecord[];
  internalNotes: string;
}

export const creators: Creator[] = [
  {
    id: "creator-mike",
    name: "Mike Chen",
    displayName: "@CreatorMike",
    email: "mike@creatormike.com",
    primaryPlatform: "YouTube",
    status: "active",
    activeSponsors: 4,
    avatarInitials: "MC",
    avatarColor: "from-violet-500 to-purple-600",
    bio: "Gaming and tech reviews with a focus on competitive FPS content. 2M+ subscribers across platforms.",
    location: "Los Angeles, CA",
    joinedDate: "Jan 2023",
    socialAccounts: [
      {
        platform: "YouTube",
        handle: "@CreatorMike",
        followers: "1.2M",
        url: "https://youtube.com/@CreatorMike",
      },
      {
        platform: "Twitch",
        handle: "CreatorMike",
        followers: "480K",
        url: "https://twitch.tv/CreatorMike",
      },
      {
        platform: "TikTok",
        handle: "@creatormike",
        followers: "890K",
        url: "https://tiktok.com/@creatormike",
      },
    ],
    metrics: [
      { label: "Monthly Views", value: "4.2M", change: "+18%", trend: "up" },
      { label: "Avg. Engagement", value: "6.8%", change: "+0.4%", trend: "up" },
      { label: "Revenue (MTD)", value: "$42,800", change: "+24%", trend: "up" },
      { label: "Brand Fit Score", value: "92", change: "+3", trend: "up" },
    ],
    sponsorshipHistory: [
      {
        id: "sp-1",
        sponsor: "Nike",
        campaign: "Air Max Gaming Collection",
        value: "$28,000",
        status: "active",
        startDate: "Mar 2026",
        endDate: "Sep 2026",
      },
      {
        id: "sp-2",
        sponsor: "Logitech",
        campaign: "G Pro X Superlight 2",
        value: "$15,000",
        status: "active",
        startDate: "Jan 2026",
        endDate: "Dec 2026",
      },
      {
        id: "sp-3",
        sponsor: "Monster Energy",
        campaign: "Summer Stream Series",
        value: "$12,000",
        status: "completed",
        startDate: "Jun 2025",
        endDate: "Aug 2025",
      },
    ],
    internalNotes:
      "High priority creator. Excellent deliverable track record. Prefers email communication. Renewal discussion scheduled for Q3.",
  },
  {
    id: "sarah-streams",
    name: "Sarah Williams",
    displayName: "@SarahStreams",
    email: "sarah@sarahstreams.tv",
    primaryPlatform: "Twitch",
    status: "active",
    activeSponsors: 3,
    avatarInitials: "SW",
    avatarColor: "from-fuchsia-500 to-pink-600",
    bio: "Variety streamer specializing in cozy games and community events. Known for high chat engagement.",
    location: "Austin, TX",
    joinedDate: "Mar 2023",
    socialAccounts: [
      {
        platform: "Twitch",
        handle: "SarahStreams",
        followers: "620K",
        url: "https://twitch.tv/SarahStreams",
      },
      {
        platform: "YouTube",
        handle: "@SarahStreams",
        followers: "310K",
        url: "https://youtube.com/@SarahStreams",
      },
      {
        platform: "Instagram",
        handle: "@sarahstreams",
        followers: "245K",
        url: "https://instagram.com/sarahstreams",
      },
    ],
    metrics: [
      { label: "Monthly Views", value: "2.8M", change: "+12%", trend: "up" },
      { label: "Avg. Engagement", value: "9.2%", change: "+1.1%", trend: "up" },
      { label: "Revenue (MTD)", value: "$38,200", change: "+19%", trend: "up" },
      { label: "Brand Fit Score", value: "88", change: "+2", trend: "up" },
    ],
    sponsorshipHistory: [
      {
        id: "sp-4",
        sponsor: "Red Bull",
        campaign: "Q2 Stream Partnership",
        value: "$22,000",
        status: "active",
        startDate: "Apr 2026",
        endDate: "Jun 2026",
      },
      {
        id: "sp-5",
        sponsor: "Secretlab",
        campaign: "Chair Ambassador Program",
        value: "$8,000",
        status: "active",
        startDate: "Feb 2026",
      },
      {
        id: "sp-6",
        sponsor: "Discord",
        campaign: "Nitro Creator Push",
        value: "$6,500",
        status: "completed",
        startDate: "Nov 2025",
        endDate: "Jan 2026",
      },
    ],
    internalNotes:
      "Strong community builder. Great fit for lifestyle and gaming peripheral brands. Interested in long-term ambassador roles.",
  },
  {
    id: "game-pro",
    name: "Alex Rivera",
    displayName: "@GamePro",
    email: "alex@gamepro.gg",
    primaryPlatform: "YouTube",
    status: "active",
    activeSponsors: 2,
    avatarInitials: "AR",
    avatarColor: "from-blue-500 to-cyan-600",
    bio: "Esports analyst and competitive gaming content creator. Tournament coverage and meta breakdowns.",
    location: "Miami, FL",
    joinedDate: "Jun 2023",
    socialAccounts: [
      {
        platform: "YouTube",
        handle: "@GamePro",
        followers: "950K",
        url: "https://youtube.com/@GamePro",
      },
      {
        platform: "TikTok",
        handle: "@gamepro",
        followers: "1.1M",
        url: "https://tiktok.com/@gamepro",
      },
      {
        platform: "Kick",
        handle: "GamePro",
        followers: "85K",
        url: "https://kick.com/GamePro",
      },
    ],
    metrics: [
      { label: "Monthly Views", value: "3.1M", change: "+8%", trend: "up" },
      { label: "Avg. Engagement", value: "5.4%", change: "-0.2%", trend: "down" },
      { label: "Revenue (MTD)", value: "$31,500", change: "+15%", trend: "up" },
      { label: "Brand Fit Score", value: "85", change: "0", trend: "up" },
    ],
    sponsorshipHistory: [
      {
        id: "sp-7",
        sponsor: "Adidas",
        campaign: "Creator Deliverables Q1",
        value: "$18,000",
        status: "completed",
        startDate: "Jan 2026",
        endDate: "Mar 2026",
      },
      {
        id: "sp-8",
        sponsor: "Razer",
        campaign: "Peripheral Launch Series",
        value: "$14,000",
        status: "active",
        startDate: "May 2026",
        endDate: "Aug 2026",
      },
    ],
    internalNotes:
      "Delivered Adidas campaign ahead of schedule. Strong esports audience demographics — ideal for hardware sponsors.",
  },
  {
    id: "tech-vibes",
    name: "Jordan Lee",
    displayName: "@TechVibes",
    email: "jordan@techvibes.io",
    primaryPlatform: "TikTok",
    status: "pending",
    activeSponsors: 1,
    avatarInitials: "JL",
    avatarColor: "from-emerald-500 to-teal-600",
    bio: "Short-form tech reviews and gadget unboxings. Rapid growth on TikTok and Instagram Reels.",
    location: "Seattle, WA",
    joinedDate: "Nov 2025",
    socialAccounts: [
      {
        platform: "TikTok",
        handle: "@techvibes",
        followers: "2.4M",
        url: "https://tiktok.com/@techvibes",
      },
      {
        platform: "Instagram",
        handle: "@techvibes",
        followers: "520K",
        url: "https://instagram.com/techvibes",
      },
      {
        platform: "YouTube",
        handle: "@TechVibes",
        followers: "180K",
        url: "https://youtube.com/@TechVibes",
      },
    ],
    metrics: [
      { label: "Monthly Views", value: "8.6M", change: "+42%", trend: "up" },
      { label: "Avg. Engagement", value: "11.3%", change: "+2.8%", trend: "up" },
      { label: "Revenue (MTD)", value: "$28,900", change: "+11%", trend: "up" },
      { label: "Brand Fit Score", value: "79", change: "+8", trend: "up" },
    ],
    sponsorshipHistory: [
      {
        id: "sp-9",
        sponsor: "Samsung",
        campaign: "Galaxy Unpacked Coverage",
        value: "$20,000",
        status: "pending",
        startDate: "Jun 2026",
      },
    ],
    internalNotes:
      "Onboarding in progress. Contract review pending legal. High growth potential — prioritize for tech sponsor pitches.",
  },
  {
    id: "luna-plays",
    name: "Luna Martinez",
    displayName: "@LunaPlays",
    email: "luna@lunaplays.com",
    primaryPlatform: "Twitch",
    status: "on-hold",
    activeSponsors: 0,
    avatarInitials: "LM",
    avatarColor: "from-amber-500 to-orange-600",
    bio: "Indie game explorer and narrative-driven content. Hiatus since March 2026 for personal reasons.",
    location: "Portland, OR",
    joinedDate: "Aug 2022",
    socialAccounts: [
      {
        platform: "Twitch",
        handle: "LunaPlays",
        followers: "290K",
        url: "https://twitch.tv/LunaPlays",
      },
      {
        platform: "YouTube",
        handle: "@LunaPlays",
        followers: "145K",
        url: "https://youtube.com/@LunaPlays",
      },
    ],
    metrics: [
      { label: "Monthly Views", value: "420K", change: "-65%", trend: "down" },
      { label: "Avg. Engagement", value: "7.1%", change: "-1.2%", trend: "down" },
      { label: "Revenue (MTD)", value: "$2,100", change: "-80%", trend: "down" },
      { label: "Brand Fit Score", value: "72", change: "-5", trend: "down" },
    ],
    sponsorshipHistory: [
      {
        id: "sp-10",
        sponsor: "Humble Bundle",
        campaign: "Indie Showcase",
        value: "$5,000",
        status: "completed",
        startDate: "Oct 2025",
        endDate: "Dec 2025",
      },
    ],
    internalNotes:
      "On voluntary hiatus. Check in monthly. Do not pitch new sponsors until return date is confirmed (est. Jul 2026).",
  },
  {
    id: "nova-knight",
    name: "Chris Thompson",
    displayName: "@NovaKnight",
    email: "chris@novaknight.gg",
    primaryPlatform: "Kick",
    status: "inactive",
    activeSponsors: 0,
    avatarInitials: "CT",
    avatarColor: "from-slate-500 to-slate-600",
    bio: "Former competitive MOBA streamer. Account inactive — exploring platform migration options.",
    location: "Chicago, IL",
    joinedDate: "Feb 2022",
    socialAccounts: [
      {
        platform: "Kick",
        handle: "NovaKnight",
        followers: "42K",
        url: "https://kick.com/NovaKnight",
      },
      {
        platform: "Twitch",
        handle: "NovaKnight",
        followers: "180K",
        url: "https://twitch.tv/NovaKnight",
      },
    ],
    metrics: [
      { label: "Monthly Views", value: "85K", change: "-92%", trend: "down" },
      { label: "Avg. Engagement", value: "2.1%", change: "-4.5%", trend: "down" },
      { label: "Revenue (MTD)", value: "$0", change: "-100%", trend: "down" },
      { label: "Brand Fit Score", value: "45", change: "-12", trend: "down" },
    ],
    sponsorshipHistory: [
      {
        id: "sp-11",
        sponsor: "GFuel",
        campaign: "Flavor Launch",
        value: "$8,000",
        status: "completed",
        startDate: "Aug 2024",
        endDate: "Oct 2024",
      },
    ],
    internalNotes:
      "Inactive since Dec 2025. Last contact: considering return to Twitch. Archive unless re-engaged by Jul 2026.",
  },
];

export function getCreatorById(id: string): Creator | undefined {
  return creators.find((c) => c.id === id);
}
