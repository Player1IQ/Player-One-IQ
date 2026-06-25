"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, X } from "lucide-react";

interface PortalAlertsBannerProps {
  overdueDeliverables: number;
  unreadMessages: number;
  acceptedApplications?: number;
  underReviewApplications?: number;
}

type AlertType = "overdue" | "messages" | "accepted" | "under_review";

function dismissKey(type: AlertType): string {
  return `portal-alert-dismiss-${type}`;
}

export function PortalAlertsBanner({
  overdueDeliverables,
  unreadMessages,
  acceptedApplications = 0,
  underReviewApplications = 0,
}: PortalAlertsBannerProps) {
  const [dismissed, setDismissed] = useState({
    overdue: false,
    messages: false,
    accepted: false,
    under_review: false,
  });

  useEffect(() => {
    setDismissed({
      overdue: sessionStorage.getItem(dismissKey("overdue")) === "1",
      messages: sessionStorage.getItem(dismissKey("messages")) === "1",
      accepted: sessionStorage.getItem(dismissKey("accepted")) === "1",
      under_review: sessionStorage.getItem(dismissKey("under_review")) === "1",
    });
  }, []);

  function dismiss(type: AlertType) {
    sessionStorage.setItem(dismissKey(type), "1");
    setDismissed((current) => ({ ...current, [type]: true }));
  }

  const showOverdue = overdueDeliverables > 0 && !dismissed.overdue;
  const showMessages = unreadMessages > 0 && !dismissed.messages;
  const showAccepted = acceptedApplications > 0 && !dismissed.accepted;
  const showUnderReview =
    underReviewApplications > 0 && !dismissed.under_review;

  if (!showOverdue && !showMessages && !showAccepted && !showUnderReview) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showAccepted ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-emerald-100">
              {acceptedApplications} application
              {acceptedApplications === 1 ? "" : "s"} accepted
            </p>
            <p className="mt-0.5 text-xs text-emerald-200/80">
              A brand accepted your pitch — check your deals and next steps.
            </p>
            <Link
              href="/opportunities/applications"
              className="mt-2 inline-block text-sm font-medium text-emerald-100 underline decoration-emerald-300/50 underline-offset-2 hover:text-white"
            >
              View applications
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss("accepted")}
            className="shrink-0 rounded-lg p-1 text-emerald-300/80 hover:bg-emerald-500/10 hover:text-emerald-100"
            aria-label="Dismiss accepted applications alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {showUnderReview ? (
        <div className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sky-100">
              {underReviewApplications} application
              {underReviewApplications === 1 ? "" : "s"} under review
            </p>
            <p className="mt-0.5 text-xs text-sky-200/80">
              Brands are reviewing your submissions — keep an eye on messages.
            </p>
            <Link
              href="/opportunities/applications"
              className="mt-2 inline-block text-sm font-medium text-sky-100 underline decoration-sky-300/50 underline-offset-2 hover:text-white"
            >
              Track status
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss("under_review")}
            className="shrink-0 rounded-lg p-1 text-sky-300/80 hover:bg-sky-500/10 hover:text-sky-100"
            aria-label="Dismiss under review applications alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {showOverdue ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-100">
              {overdueDeliverables} overdue deliverable
              {overdueDeliverables === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-red-200/80">
              Review your open contract deliverables and submit or update status.
            </p>
            <Link
              href="/portal/deliverables"
              className="mt-2 inline-block text-sm font-medium text-red-100 underline decoration-red-300/50 underline-offset-2 hover:text-white"
            >
              Open deliverables inbox
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss("overdue")}
            className="shrink-0 rounded-lg p-1 text-red-300/80 hover:bg-red-500/10 hover:text-red-100"
            aria-label="Dismiss overdue deliverables alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {showMessages ? (
        <div className="flex items-start gap-3 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-violet-100">
              {unreadMessages} unread message
              {unreadMessages === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-violet-200/80">
              A sponsor or deal room may be waiting on your reply.
            </p>
            <Link
              href="/messages"
              className="mt-2 inline-block text-sm font-medium text-violet-100 underline decoration-violet-300/50 underline-offset-2 hover:text-white"
            >
              Open messages
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss("messages")}
            className="shrink-0 rounded-lg p-1 text-violet-300/80 hover:bg-violet-500/10 hover:text-violet-100"
            aria-label="Dismiss unread messages alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
