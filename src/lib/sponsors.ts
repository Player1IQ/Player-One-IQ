export type SponsorStatus = "active" | "prospect" | "inactive" | "negotiating";

export type Industry =
  | "Gaming"
  | "Apparel"
  | "Beverages"
  | "Technology"
  | "Automotive"
  | "Entertainment"
  | "Consumer Electronics";

export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface ActiveDeal {
  id: string;
  campaign: string;
  creator: string;
  value: string;
  status: "active" | "pending" | "completed";
  startDate: string;
  endDate?: string;
}

export interface Sponsor {
  id: string;
  companyName: string;
  logoInitials: string;
  logoColor: string;
  industry: Industry;
  status: SponsorStatus;
  activeDeals: number;
  website: string;
  headquarters: string;
  founded: string;
  description: string;
  primaryContact: ContactInfo;
  secondaryContact?: ContactInfo;
  deals: ActiveDeal[];
  totalSpend: string;
  joinedDate: string;
  internalNotes: string;
}

export const sponsors: Sponsor[] = [
  {
    id: "nike",
    companyName: "Nike",
    logoInitials: "NK",
    logoColor: "from-gray-700 to-gray-900",
    industry: "Apparel",
    status: "active",
    activeDeals: 3,
    website: "https://nike.com",
    headquarters: "Beaverton, OR",
    founded: "1964",
    description:
      "Global leader in athletic footwear, apparel, and equipment. Focus on gaming and esports creator partnerships for Gen Z reach.",
    primaryContact: {
      name: "Rachel Kim",
      title: "Director, Creator Partnerships",
      email: "rachel.kim@nike.com",
      phone: "+1 (503) 555-0142",
    },
    secondaryContact: {
      name: "Marcus Webb",
      title: "Brand Manager, Gaming",
      email: "marcus.webb@nike.com",
      phone: "+1 (503) 555-0198",
    },
    deals: [
      {
        id: "deal-nk-1",
        campaign: "Air Max Gaming Collection",
        creator: "@CreatorMike",
        value: "$28,000",
        status: "active",
        startDate: "Mar 2026",
        endDate: "Sep 2026",
      },
      {
        id: "deal-nk-2",
        campaign: "Jordan Brand Stream Series",
        creator: "@GamePro",
        value: "$35,000",
        status: "active",
        startDate: "Apr 2026",
        endDate: "Oct 2026",
      },
      {
        id: "deal-nk-3",
        campaign: "Nike Training Creator Push",
        creator: "@SarahStreams",
        value: "$18,000",
        status: "pending",
        startDate: "Jul 2026",
      },
    ],
    totalSpend: "$142,000",
    joinedDate: "Feb 2023",
    internalNotes:
      "Tier 1 partner. Annual review in Q4. Strong interest in expanding into TikTok creators. Decision-maker is Rachel — loop her in on all proposals above $20K.",
  },
  {
    id: "red-bull",
    companyName: "Red Bull",
    logoInitials: "RB",
    logoColor: "from-red-600 to-red-800",
    industry: "Beverages",
    status: "active",
    activeDeals: 2,
    website: "https://redbull.com",
    headquarters: "Salzburg, Austria",
    founded: "1987",
    description:
      "Energy drink brand with deep roots in esports, extreme sports, and gaming culture. Prefers long-term ambassador relationships.",
    primaryContact: {
      name: "Tomás Herrera",
      title: "Head of Gaming Partnerships",
      email: "tomas.herrera@redbull.com",
      phone: "+1 (310) 555-0234",
    },
    deals: [
      {
        id: "deal-rb-1",
        campaign: "Q2 Stream Partnership",
        creator: "@SarahStreams",
        value: "$22,000",
        status: "active",
        startDate: "Apr 2026",
        endDate: "Jun 2026",
      },
      {
        id: "deal-rb-2",
        campaign: "Red Bull Gaming Sphere",
        creator: "@CreatorMike",
        value: "$40,000",
        status: "active",
        startDate: "May 2026",
        endDate: "Nov 2026",
      },
    ],
    totalSpend: "$186,000",
    joinedDate: "Jan 2022",
    internalNotes:
      "Excellent payment history. Fast approvals on renewals. Looking for 2–3 new gaming creators in H2 2026. Budget ceiling ~$50K per deal.",
  },
  {
    id: "logitech",
    companyName: "Logitech",
    logoInitials: "LG",
    logoColor: "from-blue-600 to-blue-800",
    industry: "Consumer Electronics",
    status: "active",
    activeDeals: 2,
    website: "https://logitech.com",
    headquarters: "Lausanne, Switzerland",
    founded: "1981",
    description:
      "Peripherals and streaming equipment manufacturer. Heavy investment in creator ecosystem through Logitech G and Blue Microphones.",
    primaryContact: {
      name: "Emily Park",
      title: "Creator Marketing Lead",
      email: "emily.park@logitechg.com",
      phone: "+1 (408) 555-0311",
    },
    deals: [
      {
        id: "deal-lg-1",
        campaign: "G Pro X Superlight 2 Launch",
        creator: "@CreatorMike",
        value: "$15,000",
        status: "active",
        startDate: "Jan 2026",
        endDate: "Dec 2026",
      },
      {
        id: "deal-lg-2",
        campaign: "Stream Setup Showcase",
        creator: "@TechVibes",
        value: "$12,000",
        status: "pending",
        startDate: "Jun 2026",
      },
    ],
    totalSpend: "$94,000",
    joinedDate: "Aug 2023",
    internalNotes:
      "Product seeding program available for all roster creators. Emily responds within 24hrs. Prefers integrated content over dedicated ads.",
  },
  {
    id: "razer",
    companyName: "Razer",
    logoInitials: "RZ",
    logoColor: "from-green-600 to-green-900",
    industry: "Gaming",
    status: "active",
    activeDeals: 1,
    website: "https://razer.com",
    headquarters: "Irvine, CA",
    founded: "2005",
    description:
      "Leading gaming hardware and lifestyle brand. Targets competitive gamers and high-production streamers for product launches.",
    primaryContact: {
      name: "David Okonkwo",
      title: "Partnerships Manager",
      email: "david.okonkwo@razer.com",
      phone: "+1 (949) 555-0445",
    },
    deals: [
      {
        id: "deal-rz-1",
        campaign: "Peripheral Launch Series",
        creator: "@GamePro",
        value: "$14,000",
        status: "active",
        startDate: "May 2026",
        endDate: "Aug 2026",
      },
    ],
    totalSpend: "$67,000",
    joinedDate: "Mar 2024",
    internalNotes:
      "Agile partner — can turn around deals in under 2 weeks. Interested in co-branded content. David is the sole point of contact for now.",
  },
  {
    id: "samsung",
    companyName: "Samsung",
    logoInitials: "SS",
    logoColor: "from-indigo-600 to-blue-700",
    industry: "Technology",
    status: "negotiating",
    activeDeals: 1,
    website: "https://samsung.com",
    headquarters: "Seoul, South Korea",
    founded: "1938",
    description:
      "Global technology conglomerate. Creator partnerships focused on mobile, displays, and Galaxy ecosystem integrations.",
    primaryContact: {
      name: "Jennifer Liu",
      title: "Senior Manager, Influencer Marketing",
      email: "jennifer.liu@samsung.com",
      phone: "+1 (212) 555-0567",
    },
    deals: [
      {
        id: "deal-ss-1",
        campaign: "Galaxy Unpacked Coverage",
        creator: "@TechVibes",
        value: "$20,000",
        status: "pending",
        startDate: "Jun 2026",
      },
    ],
    totalSpend: "$48,000",
    joinedDate: "Nov 2025",
    internalNotes:
      "Contract in legal review. Jennifer is championing the TechVibes deal. Expect 3–4 week approval cycle. Strong upsell potential for display products.",
  },
  {
    id: "adidas",
    companyName: "Adidas",
    logoInitials: "AD",
    logoColor: "from-slate-700 to-slate-900",
    industry: "Apparel",
    status: "active",
    activeDeals: 1,
    website: "https://adidas.com",
    headquarters: "Herzogenaurach, Germany",
    founded: "1949",
    description:
      "Sportswear and lifestyle brand expanding creator partnerships in gaming and streetwear crossover audiences.",
    primaryContact: {
      name: "Sophie Laurent",
      title: "Creator Partnerships, NA",
      email: "sophie.laurent@adidas.com",
      phone: "+1 (503) 555-0678",
    },
    deals: [
      {
        id: "deal-ad-1",
        campaign: "Creator Deliverables Q1",
        creator: "@GamePro",
        value: "$18,000",
        status: "completed",
        startDate: "Jan 2026",
        endDate: "Mar 2026",
      },
    ],
    totalSpend: "$72,000",
    joinedDate: "Jun 2023",
    internalNotes:
      "Completed first campaign successfully. Sophie wants to renew for Q3. Competitive with Nike on pricing — use as leverage in negotiations.",
  },
  {
    id: "monster-energy",
    companyName: "Monster Energy",
    logoInitials: "ME",
    logoColor: "from-lime-500 to-green-700",
    industry: "Beverages",
    status: "prospect",
    activeDeals: 0,
    website: "https://monsterenergy.com",
    headquarters: "Corona, CA",
    founded: "1935",
    description:
      "Energy drink brand with strong presence in action sports and gaming. Exploring expanded creator roster for 2026.",
    primaryContact: {
      name: "Jake Morrison",
      title: "Brand Partnerships Coordinator",
      email: "jake.morrison@monsterenergy.com",
      phone: "+1 (951) 555-0789",
    },
    deals: [],
    totalSpend: "$24,000",
    joinedDate: "Apr 2026",
    internalNotes:
      "New prospect — initial call completed. Interested in 3–5 mid-tier gaming creators. Budget TBD. Follow up by end of month with roster recommendations.",
  },
  {
    id: "gfuel",
    companyName: "G FUEL",
    logoInitials: "GF",
    logoColor: "from-cyan-500 to-blue-600",
    industry: "Beverages",
    status: "inactive",
    activeDeals: 0,
    website: "https://gfuel.com",
    headquarters: "New York, NY",
    founded: "2012",
    description:
      "Gaming-focused energy formula brand. Historically strong creator partnerships but reduced spend in 2025.",
    primaryContact: {
      name: "Amy Chen",
      title: "Influencer Relations",
      email: "amy.chen@gfuel.com",
      phone: "+1 (646) 555-0890",
    },
    deals: [],
    totalSpend: "$31,000",
    joinedDate: "Sep 2022",
    internalNotes:
      "Inactive since Q4 2025 — budget reallocation. Amy indicated potential re-engagement in Q4 2026. Do not pitch until September.",
  },
];

export function getSponsorById(id: string): Sponsor | undefined {
  return sponsors.find((s) => s.id === id);
}
