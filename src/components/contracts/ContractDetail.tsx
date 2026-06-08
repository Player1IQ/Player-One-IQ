import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Building2,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  Upload,
  Clock,
  CreditCard,
  Flag,
  RefreshCw,
} from "lucide-react";
import type { Contract, TimelineEvent } from "@/lib/contracts";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface ContractDetailProps {
  contract: Contract;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const timelineIcons: Record<TimelineEvent["type"], typeof Calendar> = {
  signed: FileText,
  milestone: Flag,
  payment: CreditCard,
  deliverable: CheckCircle2,
  renewal: RefreshCw,
};

const timelineColors: Record<TimelineEvent["type"], string> = {
  signed: "bg-accent/10 text-accent-light ring-accent/20",
  milestone: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  payment: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  deliverable: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  renewal: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
};

const fileTypeIcons: Record<string, string> = {
  pdf: "bg-red-500/10 text-red-400",
  doc: "bg-blue-500/10 text-blue-400",
  image: "bg-pink-500/10 text-pink-400",
  other: "bg-gray-500/10 text-gray-400",
};

export function ContractDetail({ contract }: ContractDetailProps) {
  const completedDeliverables = contract.deliverables.filter(
    (d) => d.completed
  ).length;
  const progress = Math.round(
    (completedDeliverables / contract.deliverables.length) * 100
  );

  return (
    <div className="space-y-6">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contracts
      </Link>

      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/5" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{contract.name}</h2>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
            {contract.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent-light" />
              <span className="text-lg font-bold text-white">
                {contract.valueDisplay}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="h-4 w-4 text-gray-500" />
              <Link
                href={`/creators/${contract.creatorId}`}
                className="transition-colors hover:text-accent-light"
              >
                {contract.creator}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="h-4 w-4 text-gray-500" />
              <Link
                href={`/sponsors/${contract.sponsorId}`}
                className="transition-colors hover:text-accent-light"
              >
                {contract.sponsor}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            Start Date
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {contract.startDate}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            End Date
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {contract.endDate}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Renewal Date
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {contract.renewalDate ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Contract Information">
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-border-subtle pb-3">
              <dt className="text-sm text-gray-500">Contract ID</dt>
              <dd className="font-mono text-sm text-gray-300">{contract.id}</dd>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-3">
              <dt className="text-sm text-gray-500">Creator</dt>
              <dd>
                <Link
                  href={`/creators/${contract.creatorId}`}
                  className="text-sm font-medium text-accent-light hover:text-white"
                >
                  {contract.creator}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-3">
              <dt className="text-sm text-gray-500">Sponsor</dt>
              <dd>
                <Link
                  href={`/sponsors/${contract.sponsorId}`}
                  className="text-sm font-medium text-accent-light hover:text-white"
                >
                  {contract.sponsor}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-3">
              <dt className="text-sm text-gray-500">Contract Value</dt>
              <dd className="text-sm font-semibold text-white">
                {contract.valueDisplay}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <ContractStatusBadge status={contract.status} />
              </dd>
            </div>
          </dl>
        </Section>

        <Section
          title="Contract Timeline"
          description="Key milestones and events"
        >
          <div className="relative space-y-0">
            {contract.timeline.map((event, i) => {
              const Icon = timelineIcons[event.type];
              const isLast = i === contract.timeline.length - 1;

              return (
                <div key={`${event.date}-${event.title}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${timelineColors[event.type]}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {!isLast && (
                      <div className="my-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                    <p className="text-xs text-gray-500">{event.date}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-200">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <Section
        title="Deliverables Checklist"
        description={`${completedDeliverables} of ${contract.deliverables.length} completed`}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span className="font-medium text-accent-light">{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <ul className="space-y-2">
          {contract.deliverables.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                item.completed
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-border-subtle bg-surface"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-gray-600" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    item.completed
                      ? "text-gray-400 line-through"
                      : "text-gray-200"
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">Due {item.dueDate}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="File Attachments"
        description="Contracts, SOWs, and supporting documents"
      >
        {contract.attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle py-10">
            <Upload className="h-8 w-8 text-gray-600" />
            <p className="mt-3 text-sm text-gray-500">No files attached yet</p>
            <button className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-gray-400 transition-colors hover:border-accent/30 hover:text-accent-light">
              Upload File
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {contract.attachments.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:border-accent/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${fileTypeIcons[file.type]}`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.size} · Uploaded {file.uploadedAt}
                    </p>
                  </div>
                </div>
                <button className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-accent/10 hover:text-accent-light">
                  <Download className="h-4 w-4" />
                </button>
              </li>
            ))}
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-gray-500 transition-colors hover:border-accent/30 hover:text-accent-light">
              <Upload className="h-4 w-4" />
              Upload File
            </button>
          </ul>
        )}
      </Section>

      <Section
        title="Internal Notes"
        description="Confidential — team members only"
      >
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4">
          <p className="text-sm leading-relaxed text-gray-300">
            {contract.internalNotes}
          </p>
        </div>
      </Section>
    </div>
  );
}
