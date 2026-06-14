"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { fetchMonthlyReportExport } from "@/app/reports/actions";
import {
  downloadTextFile,
  reportCsvFilename,
  reportToCsv,
  REPORT_PRINT_PATH,
} from "@/lib/reports/export";
import { cn } from "@/lib/utils";

interface ExportReportMenuProps {
  canExport: boolean;
  variant?: "header" | "page";
  className?: string;
}

export function ExportReportMenu({
  canExport,
  variant = "page",
  className,
}: ExportReportMenuProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setError("");
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function runExport(mode: "csv" | "pdf") {
    setError("");
    startTransition(async () => {
      const result = await fetchMonthlyReportExport();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (!("report" in result) || !result.report) return;

      try {
        if (mode === "csv") {
          const csv = reportToCsv(result.report, result.organizationName);
          downloadTextFile(
            reportCsvFilename(result.report.periodLabel),
            csv,
            "text/csv;charset=utf-8"
          );
        } else {
          openPrintableReport(result.report, result.organizationName);
        }
        setOpen(false);
      } catch (exportError) {
        setError(
          exportError instanceof Error
            ? exportError.message
            : "Export failed."
        );
      }
    });
  }

  if (!canExport) {
    if (variant === "header") {
      return (
        <Link
          href="/billing"
          className={cn(
            "hidden items-center gap-1.5 rounded-xl border border-white/[0.06] bg-surface-raised/60 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-accent/30 hover:text-accent-light sm:inline-flex",
            className
          )}
          title="Upgrade to export reports"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Link>
      );
    }

    return null;
  }

  const triggerClass =
    variant === "header"
      ? "hidden items-center gap-1.5 rounded-xl border border-white/[0.06] bg-surface-raised/60 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-accent/30 hover:text-accent-light disabled:opacity-50 sm:inline-flex"
      : "inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-raised/60 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-accent/30 hover:text-white disabled:opacity-50";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isPending}
        className={triggerClass}
        aria-label="Export report"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Export
        {variant === "page" ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : null}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/[0.06] bg-surface-raised/95 shadow-2xl backdrop-blur-xl",
            variant === "header" ? "right-0" : "left-0"
          )}
        >
          <div className="border-b border-white/[0.06] px-3 py-2">
            <p className="text-xs font-medium text-white">Monthly report</p>
            <p className="text-[10px] text-gray-500">Current period</p>
          </div>
          <button
            type="button"
            onClick={() => runExport("csv")}
            disabled={isPending}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/[0.04]"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Download CSV
          </button>
          <Link
            href={REPORT_PRINT_PATH}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/[0.04]"
          >
            <FileText className="h-4 w-4 text-accent-light" />
            Print / Save PDF
          </Link>
        </div>
      )}

      {error && open ? (
        <p
          className={cn(
            "absolute z-50 mt-1 rounded-lg border border-red-500/20 bg-surface-raised px-2 py-1 text-xs text-red-400 shadow-lg",
            variant === "header" ? "right-0 top-full w-56" : "top-full"
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
