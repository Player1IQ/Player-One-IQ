export type SponsorStatus = "active" | "prospect" | "inactive" | "negotiating";

export type Industry =
  | "Gaming"
  | "Apparel"
  | "Beverages"
  | "Technology"
  | "Automotive"
  | "Entertainment"
  | "Consumer Electronics";

export const industries: Industry[] = [
  "Gaming",
  "Apparel",
  "Beverages",
  "Technology",
  "Automotive",
  "Entertainment",
  "Consumer Electronics",
];

export const sponsorStatuses: SponsorStatus[] = [
  "active",
  "prospect",
  "inactive",
  "negotiating",
];

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

export interface SponsorRow {
  id: string;
  organization_id: string;
  company_name: string;
  industry: string;
  status: SponsorStatus;
  website: string | null;
  headquarters: string | null;
  founded: string | null;
  description: string | null;
  primary_contact: ContactInfo;
  secondary_contact: ContactInfo | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  organizationId: string;
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

export interface SponsorInput {
  companyName: string;
  industry: Industry;
  status: SponsorStatus;
  website: string;
  headquarters: string;
  founded: string;
  description: string;
  primaryContact: ContactInfo;
  secondaryContact?: ContactInfo;
  internalNotes: string;
}

const logoColors = [
  "from-gray-700 to-gray-900",
  "from-red-600 to-red-800",
  "from-blue-600 to-blue-800",
  "from-green-600 to-green-900",
  "from-indigo-600 to-blue-700",
  "from-slate-700 to-slate-900",
  "from-lime-500 to-green-700",
  "from-cyan-500 to-blue-600",
  "from-violet-600 to-purple-800",
  "from-amber-600 to-orange-700",
];

export function getLogoInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return companyName.slice(0, 2).toUpperCase() || "?";
}

export function getLogoColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return logoColors[Math.abs(hash) % logoColors.length];
}

export function formatSponsorDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function parseContact(value: unknown): ContactInfo | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Record<string, unknown>;
  if (typeof c.name !== "string") return null;
  return {
    name: c.name,
    title: typeof c.title === "string" ? c.title : "",
    email: typeof c.email === "string" ? c.email : "",
    phone: typeof c.phone === "string" ? c.phone : "",
  };
}

function hasContactInfo(contact: ContactInfo): boolean {
  return !!(
    contact.name.trim() ||
    contact.email.trim() ||
    contact.title.trim() ||
    contact.phone.trim()
  );
}

export function mapSponsorRow(row: SponsorRow): Sponsor {
  const industry = industries.includes(row.industry as Industry)
    ? (row.industry as Industry)
    : "Gaming";

  const primaryContact = parseContact(row.primary_contact) ?? {
    name: "",
    title: "",
    email: "",
    phone: "",
  };

  const secondary = parseContact(row.secondary_contact);
  const secondaryContact =
    secondary && hasContactInfo(secondary) ? secondary : undefined;

  const deals: ActiveDeal[] = [];

  return {
    id: row.id,
    organizationId: row.organization_id,
    companyName: row.company_name,
    logoInitials: getLogoInitials(row.company_name),
    logoColor: getLogoColor(row.id),
    industry,
    status: row.status,
    activeDeals: deals.filter(
      (d) => d.status === "active" || d.status === "pending"
    ).length,
    website: row.website ?? "",
    headquarters: row.headquarters ?? "",
    founded: row.founded ?? "",
    description: row.description ?? "",
    primaryContact,
    secondaryContact,
    deals,
    totalSpend: "$0",
    joinedDate: formatSponsorDate(row.created_at),
    internalNotes: row.internal_notes ?? "",
  };
}
