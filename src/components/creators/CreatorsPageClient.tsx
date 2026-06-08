"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Creator } from "@/lib/creators";
import { CreatorRosterTable } from "./CreatorRosterTable";
import { AddCreatorModal } from "./AddCreatorModal";

interface CreatorsPageClientProps {
  creators: Creator[];
}

export function CreatorsPageClient({ creators }: CreatorsPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryPlatform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          <Plus className="h-4 w-4" />
          Add Creator
        </button>
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

      <CreatorRosterTable creators={filtered} />

      <AddCreatorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
