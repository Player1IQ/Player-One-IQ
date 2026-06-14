import type { MonthlyReportData } from "./build";

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function reportToCsv(
  report: MonthlyReportData,
  organizationName: string
): string {
  const lines: string[] = [];

  lines.push("Player One IQ — Monthly Report");
  lines.push(`Organization,${escapeCsv(organizationName)}`);
  lines.push(`Period,${escapeCsv(report.periodLabel)}`);
  lines.push(`Generated,${escapeCsv(new Date().toISOString())}`);
  lines.push("");

  lines.push("Summary");
  lines.push("Metric,Value");
  lines.push(`Total Revenue,${escapeCsv(report.revenue.totalDisplay)}`);
  lines.push(
    `Contract Revenue,${escapeCsv(report.revenue.contractRevenueDisplay)}`
  );
  lines.push(
    `Platform Revenue,${escapeCsv(report.revenue.platformRevenueDisplay)}`
  );
  lines.push(
    `Active Contracts,${escapeCsv(report.contractStats.activeCount)}`
  );
  lines.push(
    `Pipeline Value,${escapeCsv(report.contractStats.totalValueDisplay)}`
  );
  lines.push(`Open Opportunities,${escapeCsv(report.opportunityStats.openCount)}`);
  lines.push(
    `Total Opportunities,${escapeCsv(report.opportunityStats.totalCount)}`
  );
  lines.push("");

  lines.push("Top Creators by Revenue");
  lines.push("Creator,Contract Revenue,Platform Revenue,Total");
  for (const row of report.creatorLeaderboard) {
    lines.push(
      [
        escapeCsv(row.name),
        escapeCsv(row.contractRevenue.toFixed(2)),
        escapeCsv(row.platformRevenue.toFixed(2)),
        escapeCsv(row.total.toFixed(2)),
      ].join(",")
    );
  }
  if (report.creatorLeaderboard.length === 0) {
    lines.push("No creator revenue this month,,,");
  }
  lines.push("");

  lines.push("Platform Income");
  lines.push("Platform,Total");
  for (const row of report.platformBreakdown) {
    lines.push(`${escapeCsv(row.platform)},${escapeCsv(row.total.toFixed(2))}`);
  }
  if (report.platformBreakdown.length === 0) {
    lines.push("No platform income,,");
  }

  if (report.aiUsage.length > 0) {
    lines.push("");
    lines.push("AI Usage");
    lines.push("Assistant,Requests");
    for (const entry of report.aiUsage) {
      lines.push(
        `${escapeCsv(entry.assistantType)},${escapeCsv(entry.requestCount)}`
      );
    }
  }

  return lines.join("\r\n");
}

export function reportCsvFilename(periodLabel: string): string {
  const slug = periodLabel.toLowerCase().replace(/\s+/g, "-");
  return `player-one-iq-report-${slug}.csv`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const REPORT_PRINT_PATH = "/reports/print";
