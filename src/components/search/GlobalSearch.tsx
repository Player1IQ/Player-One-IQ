"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { SearchResult } from "@/lib/search/queries";
import { filterSearchResults, searchTypeLabels } from "@/lib/search";

interface GlobalSearchProps {
  items: SearchResult[];
}

export function GlobalSearch({ items }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () => filterSearchResults(items, query),
    [items, query]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function navigate(href: string) {
    close();
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigate(results[activeIndex].href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-accent/30 hover:text-gray-200 md:inline-flex"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-gray-500">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={close}
            aria-hidden
          />
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search creators, sponsors, contracts..."
                className="w-full bg-transparent py-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-gray-500 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  No results found.
                </p>
              ) : (
                results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => navigate(result.href)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                      index === activeIndex
                        ? "bg-accent/10 text-white"
                        : "text-gray-300 hover:bg-surface-overlay"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {searchTypeLabels[result.type]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {result.label}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {result.subtitle}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
