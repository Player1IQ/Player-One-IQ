export type ContractStatus =
  | "active"
  | "pending"
  | "expired"
  | "draft"
  | "completed";

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: "milestone" | "payment" | "deliverable" | "renewal" | "signed";
}

export interface Deliverable {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ContractAttachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: "pdf" | "doc" | "image" | "other";
}

export interface Contract {
  id: string;
  name: string;
  creator: string;
  creatorId: string;
  sponsor: string;
  sponsorId: string;
  value: number;
  valueDisplay: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  expirationDate: string;
  description: string;
  timeline: TimelineEvent[];
  deliverables: Deliverable[];
  attachments: ContractAttachment[];
  internalNotes: string;
}

export const contracts: Contract[] = [
  {
    id: "ctr-nk-mike-2026",
    name: "Air Max Gaming Collection",
    creator: "@CreatorMike",
    creatorId: "creator-mike",
    sponsor: "Nike",
    sponsorId: "nike",
    value: 28000,
    valueDisplay: "$28,000",
    status: "active",
    startDate: "Mar 1, 2026",
    endDate: "Sep 30, 2026",
    renewalDate: "Aug 1, 2026",
    expirationDate: "Sep 30, 2026",
    description:
      "Six-month integrated sponsorship featuring Air Max Gaming Collection product placements, dedicated review video, and 4 sponsored stream segments.",
    timeline: [
      {
        date: "Feb 15, 2026",
        title: "Contract Signed",
        description: "Fully executed agreement received from Nike legal.",
        type: "signed",
      },
      {
        date: "Mar 1, 2026",
        title: "Campaign Kickoff",
        description: "Creator onboarding and product shipment completed.",
        type: "milestone",
      },
      {
        date: "Mar 15, 2026",
        title: "First Payment — 50%",
        description: "$14,000 disbursed upon contract activation.",
        type: "payment",
      },
      {
        date: "Apr 20, 2026",
        title: "Review Video Delivered",
        description: "15-min Air Max Gaming review published to YouTube.",
        type: "deliverable",
      },
      {
        date: "Aug 1, 2026",
        title: "Renewal Discussion",
        description: "Scheduled check-in with Nike partnerships team.",
        type: "renewal",
      },
      {
        date: "Sep 30, 2026",
        title: "Contract End",
        description: "Final deliverable due and contract closes.",
        type: "milestone",
      },
    ],
    deliverables: [
      {
        id: "d1",
        title: "Unboxing & first impressions video",
        dueDate: "Mar 20, 2026",
        completed: true,
      },
      {
        id: "d2",
        title: "4× sponsored Twitch stream segments (30 min each)",
        dueDate: "Jun 30, 2026",
        completed: true,
      },
      {
        id: "d3",
        title: "Dedicated YouTube review (10+ min)",
        dueDate: "Apr 30, 2026",
        completed: true,
      },
      {
        id: "d4",
        title: "3× Instagram story placements",
        dueDate: "Jul 15, 2026",
        completed: false,
      },
      {
        id: "d5",
        title: "End-of-campaign performance report",
        dueDate: "Sep 30, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a1",
        name: "Nike_AirMax_Gaming_SOW.pdf",
        size: "2.4 MB",
        uploadedAt: "Feb 10, 2026",
        type: "pdf",
      },
      {
        id: "a2",
        name: "Signed_Contract_Nike_CreatorMike.pdf",
        size: "1.8 MB",
        uploadedAt: "Feb 15, 2026",
        type: "pdf",
      },
      {
        id: "a3",
        name: "Brand_Guidelines_2026.pdf",
        size: "5.1 MB",
        uploadedAt: "Feb 16, 2026",
        type: "pdf",
      },
    ],
    internalNotes:
      "High-value flagship deal. Nike wants Q3 renewal — prep deck by July. Creator exceeded view targets on review video (+34% vs. guarantee).",
  },
  {
    id: "ctr-rb-sarah-2026",
    name: "Q2 Stream Partnership",
    creator: "@SarahStreams",
    creatorId: "sarah-streams",
    sponsor: "Red Bull",
    sponsorId: "red-bull",
    value: 22000,
    valueDisplay: "$22,000",
    status: "active",
    startDate: "Apr 1, 2026",
    endDate: "Jun 30, 2026",
    renewalDate: "Jun 1, 2026",
    expirationDate: "Jun 30, 2026",
    description:
      "Quarterly stream partnership with Red Bull branding across 12 dedicated streams and community event co-hosting.",
    timeline: [
      {
        date: "Mar 20, 2026",
        title: "Contract Signed",
        description: "Agreement executed by both parties.",
        type: "signed",
      },
      {
        date: "Apr 1, 2026",
        title: "Campaign Start",
        description: "Red Bull assets and promo codes distributed.",
        type: "milestone",
      },
      {
        date: "May 15, 2026",
        title: "Mid-Campaign Check-in",
        description: "Performance review — on track for all KPIs.",
        type: "milestone",
      },
      {
        date: "Jun 1, 2026",
        title: "Renewal Window Opens",
        description: "Red Bull expressed interest in Q3 extension.",
        type: "renewal",
      },
    ],
    deliverables: [
      {
        id: "d6",
        title: "12× branded stream overlays",
        dueDate: "Jun 30, 2026",
        completed: true,
      },
      {
        id: "d7",
        title: "Community giveaway event co-host",
        dueDate: "May 30, 2026",
        completed: true,
      },
      {
        id: "d8",
        title: "2× TikTok cross-promotion clips",
        dueDate: "Jun 15, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a4",
        name: "RedBull_Q2_Stream_Agreement.pdf",
        size: "1.2 MB",
        uploadedAt: "Mar 18, 2026",
        type: "pdf",
      },
    ],
    internalNotes:
      "Expiring end of June — renewal conversation with Tomás Herrera scheduled for Jun 5. Strong engagement metrics.",
  },
  {
    id: "ctr-lg-mike-2026",
    name: "G Pro X Superlight 2 Launch",
    creator: "@CreatorMike",
    creatorId: "creator-mike",
    sponsor: "Logitech",
    sponsorId: "logitech",
    value: 15000,
    valueDisplay: "$15,000",
    status: "active",
    startDate: "Jan 15, 2026",
    endDate: "Dec 31, 2026",
    renewalDate: "Nov 1, 2026",
    expirationDate: "Dec 31, 2026",
    description:
      "Year-long ambassador deal for Logitech G Pro X Superlight 2 mouse launch with quarterly content deliverables.",
    timeline: [
      {
        date: "Jan 10, 2026",
        title: "Contract Signed",
        description: "Annual agreement executed.",
        type: "signed",
      },
      {
        date: "Jan 15, 2026",
        title: "Product Seeding",
        description: "Full peripheral kit shipped to creator.",
        type: "milestone",
      },
      {
        date: "Apr 1, 2026",
        title: "Q1 Deliverables Approved",
        description: "All Q1 content signed off by Logitech.",
        type: "deliverable",
      },
    ],
    deliverables: [
      {
        id: "d9",
        title: "Launch day unboxing stream",
        dueDate: "Jan 20, 2026",
        completed: true,
      },
      {
        id: "d10",
        title: "Q2 setup tour video",
        dueDate: "Jun 30, 2026",
        completed: false,
      },
      {
        id: "d11",
        title: "Q3 competitive gameplay series (3 episodes)",
        dueDate: "Sep 30, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a5",
        name: "Logitech_GPro_Ambassador_2026.pdf",
        size: "3.0 MB",
        uploadedAt: "Jan 8, 2026",
        type: "pdf",
      },
    ],
    internalNotes:
      "Steady annual deal. Emily Park is responsive — flag any deliverable delays early.",
  },
  {
    id: "ctr-rz-gamepro-2026",
    name: "Peripheral Launch Series",
    creator: "@GamePro",
    creatorId: "game-pro",
    sponsor: "Razer",
    sponsorId: "razer",
    value: 14000,
    valueDisplay: "$14,000",
    status: "active",
    startDate: "May 1, 2026",
    endDate: "Aug 31, 2026",
    expirationDate: "Aug 31, 2026",
    description:
      "Summer peripheral launch campaign featuring Razer keyboard and headset across esports content.",
    timeline: [
      {
        date: "Apr 22, 2026",
        title: "Contract Signed",
        description: "Fast-track approval — 9 day turnaround.",
        type: "signed",
      },
      {
        date: "May 1, 2026",
        title: "Campaign Launch",
        description: "Products received and first content scheduled.",
        type: "milestone",
      },
    ],
    deliverables: [
      {
        id: "d12",
        title: "Product review video",
        dueDate: "May 20, 2026",
        completed: true,
      },
      {
        id: "d13",
        title: "Tournament coverage with Razer branding",
        dueDate: "Jul 31, 2026",
        completed: false,
      },
      {
        id: "d14",
        title: "Social media asset pack (6 posts)",
        dueDate: "Aug 15, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a6",
        name: "Razer_Launch_Series_SOW.pdf",
        size: "1.5 MB",
        uploadedAt: "Apr 20, 2026",
        type: "pdf",
      },
    ],
    internalNotes:
      "David Okonkwo managing directly. Creator delivered review early — strong relationship builder for future Razer deals.",
  },
  {
    id: "ctr-ss-techvibes-2026",
    name: "Galaxy Unpacked Coverage",
    creator: "@TechVibes",
    creatorId: "tech-vibes",
    sponsor: "Samsung",
    sponsorId: "samsung",
    value: 20000,
    valueDisplay: "$20,000",
    status: "pending",
    startDate: "Jun 15, 2026",
    endDate: "Aug 15, 2026",
    expirationDate: "Aug 15, 2026",
    description:
      "Samsung Galaxy Unpacked event coverage package — live reaction, hands-on review, and short-form content burst.",
    timeline: [
      {
        date: "May 28, 2026",
        title: "Proposal Sent",
        description: "SOW submitted to Samsung influencer team.",
        type: "milestone",
      },
      {
        date: "Jun 1, 2026",
        title: "Legal Review",
        description: "Contract in Samsung legal queue.",
        type: "milestone",
      },
    ],
    deliverables: [
      {
        id: "d15",
        title: "Live Unpacked reaction stream",
        dueDate: "Jun 20, 2026",
        completed: false,
      },
      {
        id: "d16",
        title: "Hands-on review (YouTube + TikTok)",
        dueDate: "Jul 1, 2026",
        completed: false,
      },
      {
        id: "d17",
        title: "5× TikTok short-form clips",
        dueDate: "Jul 15, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a7",
        name: "Samsung_Galaxy_SOW_Draft.pdf",
        size: "980 KB",
        uploadedAt: "May 25, 2026",
        type: "pdf",
      },
    ],
    internalNotes:
      "Awaiting Samsung legal sign-off. Jennifer Liu is champion — expect 2–3 more weeks. Do not brief creator until executed.",
  },
  {
    id: "ctr-nk-gamepro-2026",
    name: "Jordan Brand Stream Series",
    creator: "@GamePro",
    creatorId: "game-pro",
    sponsor: "Nike",
    sponsorId: "nike",
    value: 35000,
    valueDisplay: "$35,000",
    status: "pending",
    startDate: "Jul 1, 2026",
    endDate: "Oct 31, 2026",
    expirationDate: "Oct 31, 2026",
    description:
      "Jordan Brand gaming crossover campaign targeting esports audience with limited-edition collab merchandise.",
    timeline: [
      {
        date: "Jun 1, 2026",
        title: "Term Sheet Agreed",
        description: "Commercial terms finalized with Nike.",
        type: "milestone",
      },
    ],
    deliverables: [
      {
        id: "d18",
        title: "Collab reveal stream",
        dueDate: "Jul 10, 2026",
        completed: false,
      },
      {
        id: "d19",
        title: "Esports tournament sponsorship segment",
        dueDate: "Sep 1, 2026",
        completed: false,
      },
    ],
    attachments: [],
    internalNotes:
      "Largest pending deal in pipeline. Marcus Webb leading from Nike side. Priority close by mid-June.",
  },
  {
    id: "ctr-rb-mike-2026",
    name: "Red Bull Gaming Sphere",
    creator: "@CreatorMike",
    creatorId: "creator-mike",
    sponsor: "Red Bull",
    sponsorId: "red-bull",
    value: 40000,
    valueDisplay: "$40,000",
    status: "active",
    startDate: "May 1, 2026",
    endDate: "Nov 30, 2026",
    renewalDate: "Oct 1, 2026",
    expirationDate: "Nov 30, 2026",
    description:
      "Flagship Red Bull Gaming Sphere ambassador program — event appearances, content series, and exclusive activations.",
    timeline: [
      {
        date: "Apr 15, 2026",
        title: "Contract Signed",
        description: "Multi-month ambassador agreement executed.",
        type: "signed",
      },
      {
        date: "May 1, 2026",
        title: "Program Launch",
        description: "Gaming Sphere branding live across channels.",
        type: "milestone",
      },
      {
        date: "May 15, 2026",
        title: "First Payment — 40%",
        description: "$16,000 disbursed on activation.",
        type: "payment",
      },
    ],
    deliverables: [
      {
        id: "d20",
        title: "Gaming Sphere launch announcement",
        dueDate: "May 5, 2026",
        completed: true,
      },
      {
        id: "d21",
        title: "2× event appearances",
        dueDate: "Nov 1, 2026",
        completed: false,
      },
      {
        id: "d22",
        title: "Monthly content series (6 episodes)",
        dueDate: "Nov 30, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a8",
        name: "RedBull_GamingSphere_Ambassador.pdf",
        size: "4.2 MB",
        uploadedAt: "Apr 12, 2026",
        type: "pdf",
      },
      {
        id: "a9",
        name: "Event_Schedule_2026.xlsx",
        size: "340 KB",
        uploadedAt: "Apr 14, 2026",
        type: "other",
      },
    ],
    internalNotes:
      "Top-tier deal for CreatorMike. Coordinate travel for event appearances with Red Bull events team.",
  },
  {
    id: "ctr-ad-gamepro-q1",
    name: "Creator Deliverables Q1",
    creator: "@GamePro",
    creatorId: "game-pro",
    sponsor: "Adidas",
    sponsorId: "adidas",
    value: 18000,
    valueDisplay: "$18,000",
    status: "completed",
    startDate: "Jan 1, 2026",
    endDate: "Mar 31, 2026",
    expirationDate: "Mar 31, 2026",
    description:
      "Q1 Adidas creator deliverables package — completed successfully with renewal discussions underway.",
    timeline: [
      {
        date: "Dec 20, 2025",
        title: "Contract Signed",
        description: "Q1 agreement executed.",
        type: "signed",
      },
      {
        date: "Mar 31, 2026",
        title: "All Deliverables Approved",
        description: "Campaign closed — all KPIs met.",
        type: "deliverable",
      },
    ],
    deliverables: [
      {
        id: "d23",
        title: "Brand integration video",
        dueDate: "Feb 28, 2026",
        completed: true,
      },
      {
        id: "d24",
        title: "Social content pack",
        dueDate: "Mar 15, 2026",
        completed: true,
      },
    ],
    attachments: [
      {
        id: "a10",
        name: "Adidas_Q1_Completion_Report.pdf",
        size: "1.1 MB",
        uploadedAt: "Apr 1, 2026",
        type: "pdf",
      },
    ],
    internalNotes:
      "Completed ahead of schedule. Sophie Laurent interested in Q3 renewal — prepare proposal.",
  },
  {
    id: "ctr-nk-sarah-pending",
    name: "Nike Training Creator Push",
    creator: "@SarahStreams",
    creatorId: "sarah-streams",
    sponsor: "Nike",
    sponsorId: "nike",
    value: 18000,
    valueDisplay: "$18,000",
    status: "pending",
    startDate: "Jul 1, 2026",
    endDate: "Dec 31, 2026",
    expirationDate: "Dec 31, 2026",
    description:
      "Second-half Nike Training line integration targeting fitness-gaming crossover audience.",
    timeline: [
      {
        date: "Jun 1, 2026",
        title: "Proposal Submitted",
        description: "Awaiting Nike internal approval.",
        type: "milestone",
      },
    ],
    deliverables: [
      {
        id: "d25",
        title: "Training line integration streams (8×)",
        dueDate: "Dec 31, 2026",
        completed: false,
      },
    ],
    attachments: [
      {
        id: "a11",
        name: "Nike_Training_Proposal_Draft.pdf",
        size: "2.0 MB",
        uploadedAt: "May 30, 2026",
        type: "pdf",
      },
    ],
    internalNotes: "Pipeline deal — lower priority than Jordan Brand series for same creator roster.",
  },
  {
    id: "ctr-lg-techvibes-pending",
    name: "Stream Setup Showcase",
    creator: "@TechVibes",
    creatorId: "tech-vibes",
    sponsor: "Logitech",
    sponsorId: "logitech",
    value: 12000,
    valueDisplay: "$12,000",
    status: "pending",
    startDate: "Jun 20, 2026",
    endDate: "Sep 30, 2026",
    expirationDate: "Sep 30, 2026",
    description:
      "Streaming setup tour featuring Logitech peripherals for tech-focused audience.",
    timeline: [
      {
        date: "Jun 5, 2026",
        title: "Verbal Agreement",
        description: "Emily Park confirmed intent — paperwork pending.",
        type: "milestone",
      },
    ],
    deliverables: [
      {
        id: "d26",
        title: "Full setup tour video",
        dueDate: "Jul 30, 2026",
        completed: false,
      },
    ],
    attachments: [],
    internalNotes:
      "Dependent on TechVibes Samsung deal timing — coordinate so campaigns don't conflict.",
  },
];

export function getContractById(id: string): Contract | undefined {
  return contracts.find((c) => c.id === id);
}

function parseExpirationDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function isExpiringSoon(contract: Contract, withinDays = 45): boolean {
  if (contract.status !== "active") return false;
  const exp = parseExpirationDate(contract.expirationDate);
  const now = new Date("2026-06-08");
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= withinDays;
}

export function getContractStats() {
  const active = contracts.filter((c) => c.status === "active");
  const pending = contracts.filter((c) => c.status === "pending");
  const expiringSoon = contracts.filter((c) => isExpiringSoon(c));
  const totalValue = contracts
    .filter((c) => c.status === "active" || c.status === "pending")
    .reduce((sum, c) => sum + c.value, 0);

  return {
    activeCount: active.length,
    pendingCount: pending.length,
    expiringSoonCount: expiringSoon.length,
    totalValue,
    totalValueDisplay: `$${(totalValue / 1000).toFixed(0)}K`,
  };
}
