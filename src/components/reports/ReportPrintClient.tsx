"use client";

import { useEffect } from "react";

export function ReportPrintClient() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.focus();
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <p className="print:hidden p-8 text-sm text-gray-600">
      Preparing report for print… If the dialog does not open, use{" "}
      <kbd className="rounded border px-1">Ctrl+P</kbd> (or{" "}
      <kbd className="rounded border px-1">Cmd+P</kbd>).
    </p>
  );
}
