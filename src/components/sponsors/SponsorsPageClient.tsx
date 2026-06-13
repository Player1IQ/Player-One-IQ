"use client";

import { useState } from "react";
import { Plus, Search, Building2, Handshake, DollarSign } from "lucide-react";
import type { Sponsor } from "@/lib/sponsors";
import { SponsorTable } from "./SponsorTable";
import { SponsorFormModal } from "./SponsorFormModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SponsorsPageClientProps {
  sponsors: Sponsor[];
  canWrite?: boolean;
}

export function SponsorsPageClient({
  sponsors,
  canWrite = true,
}: SponsorsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = sponsors.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase()) ||
      s.primaryContact.name.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = sponsors.filter((s) => s.status === "active").length;
  const totalDeals = sponsors.reduce((sum, s) => sum + s.activeDeals, 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Sponsors"
          value={String(sponsors.length)}
          subtitle={`${activeCount} active partnerships`}
          icon={Building2}
          iconColor="text-accent-light"
        />
        <MetricCard
          title="Active Deals"
          value={String(totalDeals)}
          subtitle="Across all sponsors"
          icon={Handshake}
          iconColor="text-purple-400"
        />
        <MetricCard
          title="Pipeline Value"
          value={sponsors.length === 0 ? "—" : "$0"}
          subtitle="Tracked when contracts are added"
          icon={DollarSign}
          iconColor="text-emerald-400"
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder="Search by company, industry, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Sponsor
          </Button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-300">{filtered.length}</span>{" "}
          of {sponsors.length}
        </span>
      </div>

      <SponsorTable sponsors={filtered} canWrite={canWrite} />

      {canWrite && (
        <SponsorFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
