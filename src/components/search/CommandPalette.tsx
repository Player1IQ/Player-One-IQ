"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search, X } from "lucide-react";
import type { CommandPaletteIndex, CommandPaletteItem } from "@/lib/command-palette/types";
import {
  filterCommandPaletteResults,
} from "@/lib/command-palette/filter";
import { cn } from "@/lib/utils";

const RECENT_STORAGE_KEY = "poiq-command-palette-recent";
const RECENT_LIMIT = 5;

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
);

function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("CommandPaletteTrigger must be used within CommandPaletteProvider");
  }
  return context;
}

function readRecentItems(): CommandPaletteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommandPaletteItem[];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

function writeRecentItem(item: CommandPaletteItem) {
  const existing = readRecentItems().filter((entry) => entry.id !== item.id);
  const next = [item, ...existing].slice(0, RECENT_LIMIT);
  window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
}


interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const router = useRouter();
  const t = useTranslations("commandPalette");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [index, setIndex] = useState<CommandPaletteIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<CommandPaletteItem[]>([]);

  const results = useMemo(() => {
    if (!index) {
      return { routes: [], actions: [], entities: [], flat: [] };
    }
    return filterCommandPaletteResults(index, query);
  }, [index, query]);

  const displaySections = useMemo(() => {
    if (query.trim()) {
      return [
        { key: "routes", label: t("sections.pages"), items: results.routes },
        { key: "actions", label: t("sections.actions"), items: results.actions },
        { key: "entities", label: t("sections.entities"), items: results.entities },
      ].filter((section) => section.items.length > 0);
    }

    const recent =
      recentItems.length > 0
        ? [{ key: "recent", label: t("sections.recent"), items: recentItems }]
        : [];

    return [
      ...recent,
      {
        key: "routes",
        label: t("sections.pages"),
        items: results.routes,
      },
      {
        key: "actions",
        label: t("sections.actions"),
        items: results.actions,
      },
      {
        key: "entities",
        label: t("sections.entities"),
        items: results.entities,
      },
    ].filter((section) => section.items.length > 0);
  }, [query, recentItems, results, t]);

  const flatItems = useMemo(
    () => displaySections.flatMap((section) => section.items),
    [displaySections]
  );

  const openPalette = useCallback(() => {
    setOpen(true);
    setRecentItems(readRecentItems());
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (!open || index) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch("/api/command-palette")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load command palette");
        }
        const data = (await response.json()) as CommandPaletteIndex;
        if (!cancelled) {
          setIndex(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t("loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, index, t]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
      if (event.key === "Escape") {
        closePalette();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, openPalette]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function navigate(item: CommandPaletteItem) {
    writeRecentItem(item);
    closePalette();
    router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, flatItems.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter" && flatItems[activeIndex]) {
      event.preventDefault();
      navigate(flatItems[activeIndex]);
    }
  }

  let itemOffset = 0;

  return (
    <CommandPaletteContext.Provider
      value={{ open: openPalette, close: closePalette }}
    >
      {children}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh] backdrop-blur-sm sm:pt-[12vh]">
          <div className="absolute inset-0" onClick={closePalette} aria-hidden />
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                className="w-full bg-transparent py-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={closePalette}
                className="rounded-lg p-1 text-gray-500 hover:text-gray-300"
                aria-label={t("closeAriaLabel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </div>
              ) : loadError ? (
                <p className="px-3 py-6 text-center text-sm text-red-400">
                  {loadError}
                </p>
              ) : flatItems.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  {index ? t("noResults") : t("noRecords")}
                </p>
              ) : (
                displaySections.map((section) => {
                  const sectionStart = itemOffset;
                  itemOffset += section.items.length;

                  return (
                    <div key={section.key} className="mb-2 last:mb-0">
                      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {section.label}
                      </p>
                      {section.items.map((item, sectionIndex) => {
                        const globalIndex = sectionStart + sectionIndex;
                        const badge =
                          item.section === "entity" && item.entityType
                            ? t(`entityTypes.${item.entityType}`)
                            : item.section === "action"
                              ? t("badges.action")
                              : t("badges.page");

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate(item)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                              globalIndex === activeIndex
                                ? "bg-accent/10 text-white"
                                : "text-gray-300 hover:bg-surface-overlay"
                            )}
                          >
                            <span className="mt-0.5 shrink-0 rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                              {badge}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {item.label}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {item.subtitle}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </CommandPaletteContext.Provider>
  );
}

interface CommandPaletteTriggerProps {
  variant?: "desktop" | "mobile";
}

export function CommandPaletteTrigger({
  variant = "desktop",
}: CommandPaletteTriggerProps) {
  const { open } = useCommandPaletteContext();
  const t = useTranslations("commandPalette");

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={open}
        className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
        aria-label={t("searchAriaLabel")}
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-accent/30 hover:text-gray-200"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">{t("placeholder")}</span>
      <span className="sm:hidden">{t("searchShort")}</span>
      <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-gray-500 md:inline">
        Ctrl K
      </kbd>
    </button>
  );
}
