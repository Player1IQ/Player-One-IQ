import type { MonthlyReportData } from "./build";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildPrintableReportBody(
  report: MonthlyReportData,
  organizationName: string
): string {
  const creatorRows = report.creatorLeaderboard
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td class="num">${escapeHtml(row.totalDisplay)}</td>
        <td class="muted">${escapeHtml(
          [
            row.contractRevenue > 0
              ? `Contracts ${formatUsd(row.contractRevenue)}`
              : null,
            row.platformRevenue > 0
              ? `Platform ${formatUsd(row.platformRevenue)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || "—"
        )}</td>
      </tr>`
    )
    .join("");

  const platformRows = report.platformBreakdown
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.platform)}</td>
        <td class="num">${escapeHtml(row.totalDisplay)}</td>
      </tr>`
    )
    .join("");

  const aiRows = report.aiUsage
    .map(
      (entry) => `
      <tr>
        <td>${escapeHtml(entry.assistantType)}</td>
        <td class="num">${entry.requestCount}</td>
      </tr>`
    )
    .join("");

  return `
  <h1>Monthly Performance Report</h1>
  <p class="meta">
    <strong>${escapeHtml(organizationName)}</strong> · ${escapeHtml(report.periodLabel)} ·
    Generated ${escapeHtml(new Date().toLocaleString("en-US"))}
  </p>

  <h2>Summary</h2>
  <div class="kpis">
    <div class="kpi">
      <label>Total revenue</label>
      <strong>${escapeHtml(report.revenue.totalDisplay)}</strong>
      <span>${escapeHtml(report.revenue.subtitle)}</span>
    </div>
    <div class="kpi">
      <label>Contract pipeline</label>
      <strong>${escapeHtml(report.contractStats.totalValueDisplay)}</strong>
      <span>${report.contractStats.activeCount} active contracts</span>
    </div>
    <div class="kpi">
      <label>Opportunities</label>
      <strong>${report.opportunityStats.openCount}</strong>
      <span>${report.opportunityStats.totalCount} total</span>
    </div>
    <div class="kpi">
      <label>Platform revenue</label>
      <strong>${escapeHtml(report.revenue.platformRevenueDisplay)}</strong>
      <span>${report.revenue.connectedAccountCount} connected accounts</span>
    </div>
  </div>

  <h2>Top creators by revenue</h2>
  ${
    report.creatorLeaderboard.length === 0
      ? '<p class="empty">No creator revenue recorded this month.</p>'
      : `<table>
    <thead><tr><th>Creator</th><th>Total</th><th>Breakdown</th></tr></thead>
    <tbody>${creatorRows}</tbody>
  </table>`
  }

  <h2>Platform income</h2>
  ${
    report.platformBreakdown.length === 0
      ? '<p class="empty">No platform income this month.</p>'
      : `<table>
    <thead><tr><th>Platform</th><th>Total</th></tr></thead>
    <tbody>${platformRows}</tbody>
  </table>`
  }

  ${
    report.aiUsage.length > 0
      ? `<h2>AI usage</h2>
  <table>
    <thead><tr><th>Assistant</th><th>Requests</th></tr></thead>
    <tbody>${aiRows}</tbody>
  </table>`
      : ""
  }

  <p class="footer">Player One IQ — Confidential internal report</p>`;
}

export const reportPrintStyles = `
  .report-print-root {
    font-family: system-ui, -apple-system, sans-serif;
    color: #111;
    background: #fff;
    min-height: 100vh;
    padding: 32px;
  }
  .report-print-root h1 { font-size: 22px; margin: 0 0 4px; }
  .report-print-root .meta { color: #555; font-size: 13px; margin-bottom: 28px; }
  .report-print-root h2 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    margin: 24px 0 10px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 6px;
  }
  .report-print-root .kpis {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 8px;
  }
  .report-print-root .kpi {
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .report-print-root .kpi label {
    display: block;
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .report-print-root .kpi strong {
    display: block;
    font-size: 20px;
    margin-top: 4px;
    color: #111;
  }
  .report-print-root .kpi span { font-size: 12px; color: #666; }
  .report-print-root table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .report-print-root th,
  .report-print-root td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #eee;
  }
  .report-print-root th {
    font-size: 11px;
    text-transform: uppercase;
    color: #666;
  }
  .report-print-root .num { font-weight: 600; white-space: nowrap; }
  .report-print-root .muted { color: #666; font-size: 12px; }
  .report-print-root .empty { color: #888; font-size: 13px; padding: 8px 0; }
  .report-print-root .footer { margin-top: 32px; font-size: 11px; color: #999; }
  @media print {
    body { background: #fff !important; }
    .report-print-root { padding: 16px; }
    .print-hint { display: none !important; }
  }
`;
