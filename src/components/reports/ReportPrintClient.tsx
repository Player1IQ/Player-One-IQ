"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function ReportPrintClient() {
  const t = useTranslations("reports.printChrome");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.focus();
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <p className="print:hidden p-8 text-sm text-gray-600">
      {t("preparing")}{" "}
      <kbd className="rounded border px-1">Ctrl+P</kbd> ({t("or")}{" "}
      <kbd className="rounded border px-1">Cmd+P</kbd>).
    </p>
  );
}
