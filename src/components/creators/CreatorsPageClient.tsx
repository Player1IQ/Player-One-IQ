"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Creator } from "@/lib/creators";
import { CreatorRosterTable } from "./CreatorRosterTable";
import { CreatorFormModal } from "./CreatorFormModal";
import { SeedTestDataButton } from "@/components/dev/SeedTestDataButton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CreatorsPageClientProps {
  creators: Creator[];
  canWrite?: boolean;
  showSeedButton?: boolean;
}

export function CreatorsPageClient({
  creators,
  canWrite = true,
  showSeedButton = false,
}: CreatorsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      c.primaryPlatform.toLowerCase().includes(search.toLowerCase()) ||
      c.socialHandles.some((h) =>
        h.handle.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showSeedButton && canWrite && <SeedTestDataButton />}
          {canWrite && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Creator
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
        <span>
          <span className="font-medium text-gray-300">{filtered.length}</span>{" "}
          creators
        </span>
        <span className="text-border">|</span>
        <span>
          <span className="font-medium text-emerald-400">
            {filtered.filter((c) => c.status === "active").length}
          </span>{" "}
          active
        </span>
      </div>

      <CreatorRosterTable creators={filtered} canWrite={canWrite} />

      {canWrite && (
        <CreatorFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
