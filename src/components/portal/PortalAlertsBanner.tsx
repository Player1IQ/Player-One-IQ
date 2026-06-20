"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, X } from "lucide-react";

interface PortalAlertsBannerProps {
  overdueDeliverables: number;
  unreadMessages: number;
}

function dismissKey(type: "overdue" | "messages"): string {
  return `portal-alert-dismiss-${type}`;
}

export function PortalAlertsBanner({
  overdueDeliverables,
  unreadMessages,
}: PortalAlertsBannerProps) {
  const [dismissed, setDismissed] = useState({
    overdue: false,
    messages: false,
  });

  useEffect(() => {
    setDismissed({
      overdue: sessionStorage.getItem(dismissKey("overdue")) === "1",
      messages: sessionStorage.getItem(dismissKey("messages")) === "1",
    });
  }, []);

  function dismiss(type: "overdue" | "messages") {
    sessionStorage.setItem(dismissKey(type), "1");
    setDismissed((current) => ({ ...current, [type]: true }));
  }

  const showOverdue = overdueDeliverables > 0 && !dismissed.overdue;
  const showMessages = unreadMessages > 0 && !dismissed.messages;

  if (!showOverdue && !showMessages) {
    return null;
  }

  return (
    <div className="space-y-3">
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
              href="/contracts"
              className="mt-2 inline-block text-sm font-medium text-red-100 underline decoration-red-300/50 underline-offset-2 hover:text-white"
            >
              View your deals
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
              Your agency or deal room may be waiting on a reply.
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
